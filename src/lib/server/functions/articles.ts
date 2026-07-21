import {db} from "@/lib/server/database/db";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {and, countDistinct, desc, eq, getTableColumns, inArray, like, or, sql} from "drizzle-orm";
import {article, keyword, rssFeed, userArticle, userArticleKeyword} from "@/lib/server/database/schema";
import {archiveArticlesSchema, deleteArticlesSchema, userArticlesQuerySchema, UserArticleStatus} from "@/lib/schemas/schemas";


const getStatusConditions = (status: UserArticleStatus = "active") => {
    if (status === "archived") {
        return [eq(userArticle.isArchived, true), eq(userArticle.isDeleted, false)];
    }

    if (status === "deleted") {
        return [eq(userArticle.isDeleted, true)];
    }

    return [eq(userArticle.isArchived, false), eq(userArticle.isDeleted, false)];
};


export const getUserArticles = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .validator(userArticlesQuerySchema)
    .handler(async ({ data: { page, search, keywordsIds, status = "active" }, context: { currentUser } }) => {
        const perPage = 20;
        const pageNum = page ?? 1;
        const offset = (pageNum - 1) * perPage;

        // Base filtering
        const whereConditions = [
            eq(userArticle.userId, currentUser.id),
            ...getStatusConditions(status),
        ];

        // Add search filtering
        let searchConditions;
        if (search) {
            searchConditions = or(like(article.title, `%${search}%`), like(article.summary, `%${search}%`));
        }

        // Add keyword filtering
        let keywordConditions;
        if (keywordsIds && keywordsIds.length > 0) {
            keywordConditions = [
                eq(keyword.active, true),
                inArray(keyword.id, keywordsIds),
                eq(keyword.userId, currentUser.id),
            ]
        }
        else {
            keywordConditions = [
                eq(keyword.active, true),
                eq(keyword.userId, currentUser.id),
            ]
        }

        const totalArticles = db
            .select({ count: countDistinct(userArticle.id) })
            .from(userArticle)
            .innerJoin(article, eq(userArticle.articleId, article.id))
            .innerJoin(userArticleKeyword, eq(userArticle.id, userArticleKeyword.userArticleId))
            .innerJoin(keyword, eq(userArticleKeyword.keywordId, keyword.id))
            .where(and(...whereConditions, searchConditions, ...keywordConditions))
            .get();

        const articleRows = await db
            .select({
                link: article.link,
                title: article.title,
                summary: article.summary,
                journal: rssFeed.journal,
                publisher: rssFeed.publisher,
                ...getTableColumns(userArticle),
                keywords: sql<string[]>`json_group_array(distinct ${keyword.name})`.mapWith(row => JSON.parse(row) as string[]),
            })
            .from(userArticle)
            .innerJoin(article, eq(userArticle.articleId, article.id))
            .innerJoin(userArticleKeyword, eq(userArticle.id, userArticleKeyword.userArticleId))
            .innerJoin(keyword, eq(userArticleKeyword.keywordId, keyword.id))
            .innerJoin(rssFeed, eq(article.rssFeedId, rssFeed.id))
            .where(and(...whereConditions, searchConditions, ...keywordConditions))
            .orderBy(desc(userArticle.addedDate))
            .limit(perPage)
            .offset(offset)
            .groupBy(userArticle.id)

        // Get user's active keywords that appear in articles
        const userKeywords = await db
            .select({
                id: keyword.id,
                name: keyword.name,
                active: keyword.active,
            })
            .from(keyword)
            .innerJoin(userArticleKeyword, eq(keyword.id, userArticleKeyword.keywordId))
            .innerJoin(userArticle, eq(userArticleKeyword.userArticleId, userArticle.id))
            .where(and(
                eq(keyword.active, true),
                eq(keyword.userId, currentUser.id),
                eq(userArticle.userId, currentUser.id),
                ...getStatusConditions(status),
            ))
            .groupBy(keyword.id);

        return {
            articles: articleRows,
            keywords: userKeywords,
            pagination: {
                perPage,
                page: pageNum,
                total: totalArticles?.count ?? 0,
                pages: Math.ceil((totalArticles?.count ?? 0) / perPage),
            },
        }
    });


export const archiveArticles = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(archiveArticlesSchema)
    .handler(async ({ data: { articleIds, archive }, context: { currentUser } }) => {
        await db
            .update(userArticle)
            .set({
                isArchived: archive,
                markedAsArchivedDate: archive ? sql`(CURRENT_TIMESTAMP)` : null,
            })
            .where(and(eq(userArticle.userId, currentUser.id), inArray(userArticle.id, articleIds)))
    });


export const deleteArticles = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(deleteArticlesSchema)
    .handler(async ({ data: { isDeleted, articleIds }, context: { currentUser } }) => {
        await db
            .update(userArticle)
            .set({
                isDeleted,
                markedAsDeletedDate: isDeleted ? sql`(CURRENT_TIMESTAMP)` : null,
            })
            .where(and(eq(userArticle.userId, currentUser.id), inArray(userArticle.id, articleIds)))
    });
