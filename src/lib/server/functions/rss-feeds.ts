import {db} from "@/lib/server/database/db";
import {createServerFn} from "@tanstack/react-start";
import {fetchAndFilterArticles} from "@/lib/utils/fetch-articles";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {and, eq, inArray, isNull, like, lte, or, sql} from "drizzle-orm";
import {keyword, rssFeed, user, userRssFeed} from "@/lib/server/database/schema";
import {createRssFeedSchema, feedsIdsSchema, querySearchSchema, rssIdsSchema} from "@/lib/schemas/schemas";


export const getUserRssFeeds = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userRssFeeds = await db
            .select({
                id: rssFeed.id,
                url: rssFeed.url,
                journal: rssFeed.journal,
                userId: userRssFeed.userId,
                publisher: rssFeed.publisher,
                userRssFeedId: userRssFeed.id,
                rssFeedId: userRssFeed.rssFeedId,
                lastFetchDate: rssFeed.lastFetchDate,
                lastFetchError: rssFeed.lastFetchError,
            })
            .from(userRssFeed)
            .innerJoin(rssFeed, eq(userRssFeed.rssFeedId, rssFeed.id))
            .where(eq(userRssFeed.userId, currentUser.id));

        return userRssFeeds;
    })


export const rssFeedSearch = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(querySearchSchema)
    .handler(async ({ data: { query }, context: { currentUser } }) => {
        const rssSearchResults = await db
            .select()
            .from(rssFeed)
            .where(or(like(rssFeed.publisher, `%${query}%`), like(rssFeed.journal, `%${query}%`)))

        if (!rssSearchResults) {
            return [];
        }

        const userActiveFeeds = await db
            .select({ rssFeedId: userRssFeed.rssFeedId })
            .from(userRssFeed)
            .where(and(
                eq(userRssFeed.userId, currentUser.id),
                inArray(userRssFeed.rssFeedId, rssSearchResults.map((feed) => feed.id))
            ))

        const activeFeedIds = new Set(userActiveFeeds.map(feed => feed.rssFeedId))

        return rssSearchResults.map((result) => ({
            ...result,
            isActive: activeFeedIds.has(result.id),
        }));
    })


export const createRssFeed = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(createRssFeedSchema)
    .handler(async ({ data: { url, journal, publisher }, context: { currentUser } }) => {
        const existingFeed = db
            .select()
            .from(rssFeed)
            .where(eq(rssFeed.url, url))
            .get();

        if (existingFeed) {
            throw new Error("This RSS feed already exists");
        }

        const [newFeed] = await db
            .insert(rssFeed)
            .values({
                url,
                journal,
                publisher,
            })
            .returning({ id: rssFeed.id })

        await db
            .insert(userRssFeed)
            .values({
                rssFeedId: newFeed.id,
                userId: currentUser.id,
            })
    })


export const addRssFeedsToUser = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(feedsIdsSchema)
    .handler(async ({ data: { feedsIds }, context: { currentUser } }) => {
        const existingUserFeeds = await db
            .select({ rssFeedId: userRssFeed.rssFeedId })
            .from(userRssFeed)
            .where(and(eq(userRssFeed.userId, currentUser.id), inArray(userRssFeed.rssFeedId, feedsIds)))

        const existingFeedIds = new Set(existingUserFeeds.map((feed) => feed.rssFeedId))
        const newFeedIds = feedsIds.filter((id) => !existingFeedIds.has(id))

        if (newFeedIds.length > 0) {
            const userFeedEntries = newFeedIds.map((feedId) => ({ rssFeedId: feedId, userId: currentUser.id }))
            await db
                .insert(userRssFeed)
                .values(userFeedEntries)
        }
    })


export const removeRssFeedsFromUser = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(rssIdsSchema)
    .handler(async ({ data: { rssIds }, context: { currentUser } }) => {
        await db
            .delete(userRssFeed)
            .where(and(eq(userRssFeed.userId, currentUser.id), inArray(userRssFeed.rssFeedId, rssIds)))
    })


export const fetchUserRssFeeds = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const now = new Date();
        const DELTA_MINUTES = 30;

        const activeKeywords = await db
            .select({ name: keyword.name })
            .from(keyword)
            .where(and(eq(keyword.userId, currentUser.id), eq(keyword.active, true)))

        if (activeKeywords.length === 0) {
            return { warn: "At least one active keyword is required to fetch articles" }
        }

        const acquiredCooldown = await db
            .update(user)
            .set({ lastRssUpdate: sql`(CURRENT_TIMESTAMP)` })
            .where(and(
                eq(user.id, currentUser.id),
                or(isNull(user.lastRssUpdate), lte(user.lastRssUpdate, sql`datetime('now', ${`-${DELTA_MINUTES} minutes`})`)),
            ))
            .returning({ lastRssUpdate: user.lastRssUpdate });

        if (acquiredCooldown.length === 0) {
            const storedUser = db
                .select({ lastRssUpdate: user.lastRssUpdate })
                .from(user)
                .where(eq(user.id, currentUser.id))
                .get();

            const rawLastUpdate = storedUser?.lastRssUpdate;
            const normedLastUpdate = rawLastUpdate && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(rawLastUpdate)
                ? `${rawLastUpdate.replace(" ", "T")}Z`
                : rawLastUpdate;

            const lastUpdate = normedLastUpdate ? new Date(normedLastUpdate) : now;
            const nextAllowedUpdate = new Date(lastUpdate.getTime() + (DELTA_MINUTES * 60 * 1000));

            const diffInMs = Math.max(0, nextAllowedUpdate.getTime() - now.getTime());
            const diffInMin = Math.max(1, Math.ceil(diffInMs / (1000 * 60)));

            return { warn: `RSS Fetcher will be available in ${diffInMin} minutes` };
        }

        const result = await fetchAndFilterArticles(currentUser.id)

        if (result.failedFeeds.length > 0) {
            const failedLabels = result.failedFeeds
                .slice(0, 3)
                .map((feed) => `${feed.publisher} - ${feed.journal}`)
                .join(", ");

            return {
                failedFeeds: result.failedFeeds,
                warn: `${result.failedFeeds.length} feed(s) could not be fetched: ${failedLabels}`,
            }
        }
    })
