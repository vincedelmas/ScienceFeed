import pLimit from "p-limit";
import {db} from "@/lib/server/database/db";
import {and, eq, inArray, isNull, sql} from "drizzle-orm";
import {fetchCrossrefMetadata} from "@/lib/utils/crossref";
import type {RssRefreshProgress} from "@/lib/types/rss-refresh";
import {articleTextFromMarkup} from "@/lib/utils/article-text";
import {parseFeedPublicationDetails} from "@/lib/utils/feed-summary";
import {findMatchingKeywordIds, parseRssFeed, RssFetchError, RssItem} from "@/lib/utils/rss-parser";
import {article, keyword, rssFeed, user, userArticle, userArticleKeyword, userRssFeed} from "@/lib/server/database/schema";


const ACS_FEED_DELAY_MS = 500;
const ACS_FEED_CONCURRENCY = 1;
const GENERAL_FEED_CONCURRENCY = 4;


type Feed = {
    id: number;
    url: string;
    journal: string;
    publisher: string;
}

type UAItem = {
    articleId?: number;
    articleLink: string;
};

export type FetchArticlesResult = {
    processedFeeds: number;
    failedFeeds: {
        url: string;
        error: string;
        feedId: number;
        journal: string;
        publisher: string;
    }[];
}


const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


function isAcsFeed(url: string) {
    try {
        return new URL(url).hostname.endsWith("acs.org");
    }
    catch {
        return false;
    }
}


export async function fetchAndFilterArticles(targetUserId?: number, onProgress?: (progress: RssRefreshProgress) => void): Promise<FetchArticlesResult> {
    const userFilter = targetUserId ? eq(user.id, targetUserId) : undefined;

    const selectedUsers = await db
        .select({ id: user.id })
        .from(user)
        .where(userFilter);

    const result: FetchArticlesResult = {
        processedFeeds: 0,
        failedFeeds: [],
    };

    if (selectedUsers.length === 0) return result;
    const userIds = selectedUsers.map((u) => u.id);

    const userRssRows = await db
        .select()
        .from(userRssFeed)
        .where(inArray(userRssFeed.userId, userIds));

    const userToFeedIds = new Map<number, number[]>();
    for (const row of userRssRows) {
        const arr = userToFeedIds.get(row.userId) ?? [];
        arr.push(row.rssFeedId);
        userToFeedIds.set(row.userId, arr);
    }

    const userKeywords = await db
        .select()
        .from(keyword)
        .where(and(inArray(keyword.userId, userIds), eq(keyword.active, true)));

    const userToActiveKeywords = new Map<number, { id: number; name: string }[]>();
    for (const kw of userKeywords) {
        const arr = userToActiveKeywords.get(kw.userId) ?? [];
        arr.push({ id: kw.id, name: kw.name });
        userToActiveKeywords.set(kw.userId, arr);
    }

    const allRssFeedIds = Array.from(new Set(userRssRows.map((r) => r.rssFeedId)));
    if (allRssFeedIds.length === 0) return result;

    const feeds = await db
        .select()
        .from(rssFeed)
        .where(inArray(rssFeed.id, allRssFeedIds));

    let completed = 0;
    onProgress?.({ phase: "fetching", completed, total: feeds.length, failed: 0 });

    let lastAcsFetchAt = 0;
    const acsLimit = pLimit(ACS_FEED_CONCURRENCY);
    const generalLimit = pLimit(GENERAL_FEED_CONCURRENCY);

    const waitForAcsFetchSlot = async () => {
        const now = Date.now();
        const nextAllowedAt = lastAcsFetchAt + ACS_FEED_DELAY_MS;
        if (lastAcsFetchAt > 0 && now < nextAllowedAt) {
            await sleep(nextAllowedAt - now);
        }
        lastAcsFetchAt = Date.now();
    };

    let acsCloudflareChallengeSeen = false;
    const parsedById = new Map<number, { feed: Feed; parsed: RssItem[] }>();
    await Promise.all(feeds.map((f) =>
        (isAcsFeed(f.url) ? acsLimit : generalLimit)(async () => {
            const feedIsAcs = isAcsFeed(f.url);

            try {
                if (feedIsAcs) {
                    if (acsCloudflareChallengeSeen) {
                        throw new RssFetchError(
                            `Skipped ACS RSS feed ${f.url}. Earlier ACS request in this refresh hit a Cloudflare challenge`,
                            undefined,
                            true,
                        );
                    }

                    await waitForAcsFetchSlot();
                }

                const parsed = await parseRssFeed(f.url);
                parsedById.set(f.id, { feed: f, parsed });
                result.processedFeeds++;

                await db
                    .update(rssFeed)
                    .set({
                        lastFetchError: null,
                        lastFetchDate: sql`(CURRENT_TIMESTAMP)`,
                    })
                    .where(eq(rssFeed.id, f.id));
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown RSS fetch error";
                if (feedIsAcs && error instanceof RssFetchError && error.isCloudflareChallenge) {
                    acsCloudflareChallengeSeen = true;
                }

                await db
                    .update(rssFeed)
                    .set({
                        lastFetchError: errorMessage,
                        lastFetchDate: sql`(CURRENT_TIMESTAMP)`,
                    })
                    .where(eq(rssFeed.id, f.id));

                result.failedFeeds.push({
                    url: f.url,
                    feedId: f.id,
                    journal: f.journal,
                    error: errorMessage,
                    publisher: f.publisher,
                });
            }
            finally {
                completed++;
                onProgress?.({
                    completed,
                    phase: "fetching",
                    journal: f.journal,
                    total: feeds.length,
                    failed: result.failedFeeds.length,
                });
            }
        }),
    ));

    onProgress?.({ phase: "saving", completed, total: feeds.length, failed: result.failedFeeds.length });

    const feedMetadataByLink = new Map<string, Pick<RssItem, "doi" | "authors">>();

    for (const { parsed } of parsedById.values()) {
        for (const item of parsed) {
            if (!item.link) continue;
            const previous = feedMetadataByLink.get(item.link);
            feedMetadataByLink.set(item.link, {
                doi: item.doi ?? previous?.doi ?? null,
                authors: item.authors ?? previous?.authors ?? null,
            });
        }
    }

    const linkList = Array.from(feedMetadataByLink.keys());
    const existingArticles = linkList.length ?
        await db
            .select()
            .from(article)
            .where(inArray(article.link, linkList))
        :
        [];

    const linkToArticleId = new Map(existingArticles.map((a) => [a.link, a.id]));
    const existingByLink = new Map(existingArticles.map((a) => [a.link, a]));

    db.transaction((tx) => {
        for (const a of existingArticles) {
            const feedMetadata = feedMetadataByLink.get(a.link);
            const doi = a.doi === null ? feedMetadata?.doi : null;
            const feedAuthors = feedMetadata?.authors;
            const shouldUseFeedAuthors = feedAuthors && feedAuthors !== a.authors && (a.authors === null || a.crossrefFetched);

            if (!doi && !shouldUseFeedAuthors) continue;

            tx.update(article)
                .set({
                    doi: doi ? sql`coalesce(${article.doi}, ${doi})` : undefined,
                    authors: shouldUseFeedAuthors ? sql`case
                        when ${article.crossrefFetched} then ${feedAuthors}
                        else coalesce(${article.authors}, ${feedAuthors})
                    end` : undefined,
                })
                .where(eq(article.id, a.id))
                .run();
        }
    });

    const existingUserArticles = await db
        .select()
        .from(userArticle)
        .where(inArray(userArticle.userId, userIds));

    const userToArticleSet = new Map<number, Set<number>>();
    for (const ua of existingUserArticles) {
        const set = userToArticleSet.get(ua.userId) ?? new Set<number>();
        set.add(ua.articleId);
        userToArticleSet.set(ua.userId, set);
    }

    for (const user of selectedUsers) {
        const feedIds = userToFeedIds.get(user.id) ?? [];

        const activeKws = userToActiveKeywords.get(user.id) ?? [];
        if (activeKws.length === 0) continue;

        const pendingUA: UAItem[] = [];
        const linkToMatchedKeywordIds = new Map<string, Set<number>>();

        const pendingArticles: (typeof article.$inferInsert)[] = [];
        const userArticleSet = userToArticleSet.get(user.id) ?? new Set<number>();

        for (const feedId of feedIds) {
            const bundle = parsedById.get(feedId);
            if (!bundle) continue;

            const { feed, parsed } = bundle;
            for (const item of parsed) {
                if (!item.title || !item.link) continue;

                const matchedKeywordIds = findMatchingKeywordIds(activeKws, item);
                if (matchedKeywordIds.length === 0) continue;

                const set = linkToMatchedKeywordIds.get(item.link) ?? new Set<number>();
                matchedKeywordIds.forEach((keywordId) => set.add(keywordId));

                linkToMatchedKeywordIds.set(item.link, set);

                if (!linkToArticleId.has(item.link)) {
                    const feedMetadata = feedMetadataByLink.get(item.link);
                    pendingArticles.push({
                        link: item.link,
                        title: item.title,
                        rssFeedId: feed.id,
                        doi: feedMetadata?.doi,
                        authors: feedMetadata?.authors,
                        summary: articleTextFromMarkup(item.description ?? ""),
                    });
                }

                pendingUA.push({ articleLink: item.link });
            }
        }

        if (pendingArticles.length === 0 && pendingUA.length === 0 && linkToMatchedKeywordIds.size === 0) {
            continue;
        }

        db.transaction((tx) => {
            if (pendingArticles.length > 0) {
                const seenLinks = new Set<string>();
                const toInsert = pendingArticles.filter((a) => {
                    if (linkToArticleId.has(a.link)) return false;
                    if (seenLinks.has(a.link)) return false;

                    seenLinks.add(a.link);
                    return true;
                });

                if (toInsert.length > 0) {
                    tx
                        .insert(article)
                        .values(toInsert)
                        .run();

                    const justLinks = toInsert.map((a) => a.link);
                    const newArticles = tx
                        .select()
                        .from(article)
                        .where(inArray(article.link, justLinks))
                        .all();

                    for (const a of newArticles) {
                        linkToArticleId.set(a.link, a.id);
                    }
                }
            }

            const uaToInsert: { userId: number; articleId: number }[] = [];
            for (const item of pendingUA) {
                const aId = linkToArticleId.get(item.articleLink);
                if (aId == null) continue;

                if (!userArticleSet.has(aId)) {
                    uaToInsert.push({ userId: user.id, articleId: aId });
                    userArticleSet.add(aId);
                }
            }

            if (uaToInsert.length > 0) {
                tx
                    .insert(userArticle)
                    .values(uaToInsert)
                    .run();
            }

            const userUaRows = tx
                .select()
                .from(userArticle)
                .where(eq(userArticle.userId, user.id))
                .all();

            const articleIdToUserArticleId = new Map<number, number>();
            for (const ua of userUaRows) {
                articleIdToUserArticleId.set(ua.articleId, ua.id);
            }

            const uaIds = userUaRows.map((ua) => ua.id);
            let existingKwRels: { userArticleId: number; keywordId: number }[] = [];

            if (uaIds.length > 0) {
                existingKwRels = tx
                    .select({
                        userArticleId: userArticleKeyword.userArticleId,
                        keywordId: userArticleKeyword.keywordId,
                    })
                    .from(userArticleKeyword)
                    .where(inArray(userArticleKeyword.userArticleId, uaIds))
                    .all();
            }

            const existingRelSet = new Set<string>();
            for (const r of existingKwRels) {
                existingRelSet.add(`${r.userArticleId}:${r.keywordId}`);
            }

            const relsToInsert: { userArticleId: number; keywordId: number }[] = [];

            for (const [link, keywordIds] of linkToMatchedKeywordIds) {
                const aId = linkToArticleId.get(link);
                if (aId == null) continue;

                const uaId = articleIdToUserArticleId.get(aId);
                if (uaId == null) continue;

                for (const keywordId of keywordIds) {
                    const key = `${uaId}:${keywordId}`;

                    if (!existingRelSet.has(key)) {
                        relsToInsert.push({ userArticleId: uaId, keywordId });
                        existingRelSet.add(key);
                    }
                }
            }

            if (relsToInsert.length > 0) {
                tx
                    .insert(userArticleKeyword)
                    .values(relsToInsert)
                    .run();
            }
        });

        userToArticleSet.set(user.id, userArticleSet);
    }

    const articleIdsByDoi = new Map<string, number[]>();
    for (const [link, articleId] of linkToArticleId) {
        const existing = existingByLink.get(link);
        const feedMetadata = feedMetadataByLink.get(link);
        const doi = existing?.doi ?? feedMetadata?.doi;
        if (!doi || existing?.crossrefFetched || existing?.authors || feedMetadata?.authors) continue;
        if (existing && parseFeedPublicationDetails(existing.summary)) continue;

        const articleIds = articleIdsByDoi.get(doi) ?? [];
        articleIds.push(articleId);
        articleIdsByDoi.set(doi, articleIds);
    }

    if (articleIdsByDoi.size > 0) {
        let checked = 0;
        const progress = { phase: "enriching", total: articleIdsByDoi.size, failed: result.failedFeeds.length } as const;
        onProgress?.({ ...progress, completed: checked });

        await Promise.all(Array.from(articleIdsByDoi, async ([doi, articleIds]) => {
            const metadata = await fetchCrossrefMetadata(doi);
            if (metadata) {
                db.update(article)
                    .set({
                        crossrefFetched: true,
                        summary: metadata.summary,
                        authors: metadata.authors,
                    })
                    .where(and(
                        inArray(article.id, articleIds),
                        eq(article.doi, doi),
                        eq(article.crossrefFetched, false),
                        isNull(article.authors),
                    ))
                    .run();
            }
            onProgress?.({ ...progress, completed: ++checked });
        }));
    }

    return result;
}
