import {db} from "@/lib/server/database/db";
import {and, count, eq, sum} from "drizzle-orm";
import {createServerFn} from "@tanstack/react-start";
import {authMiddleware} from "@/lib/server/middlewares/authentication";
import {keyword, userArticle, userArticleKeyword} from "@/lib/server/database/schema";
import {keywordIdSchema, newKeywordNameSchema, toggleKeywordSchema} from "@/lib/schemas/schemas";


export const getUserKeywords = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context: { currentUser } }) => {
        const userKeywords = await db
            .select({
                id: keyword.id,
                name: keyword.name,
                active: keyword.active,
                totalArticles: count(userArticle.id),
                readArticles: sum(userArticle.isRead),
                deletedArticles: sum(userArticle.isDeleted),
                archivedArticles: sum(userArticle.isArchived),
            }).from(keyword)
            .leftJoin(userArticleKeyword, eq(keyword.id, userArticleKeyword.keywordId))
            .leftJoin(userArticle, and(
                eq(userArticle.userId, currentUser.id),
                eq(userArticleKeyword.userArticleId, userArticle.id),
            )).where(eq(keyword.userId, currentUser.id))
            .groupBy(keyword.id, keyword.name);

        return userKeywords;
    })


export const addUserKeyword = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(newKeywordNameSchema)
    .handler(async ({ data: { name }, context: { currentUser } }) => {
        const existingKeyword = db
            .select()
            .from(keyword)
            .where(and(eq(keyword.userId, currentUser.id), eq(keyword.name, name)))
            .get();

        if (existingKeyword) {
            throw new Error("Keyword already exists");
        }

        await db
            .insert(keyword)
            .values({
                name: name,
                userId: currentUser.id,
            });
    })


export const toggleUserKeyword = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(toggleKeywordSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        await db
            .update(keyword)
            .set({ active: data.active })
            .where(and(eq(keyword.id, data.keywordId), eq(keyword.userId, currentUser.id)));
    })


export const deleteUserKeyword = createServerFn({ method: "POST" })
    .middleware([authMiddleware])
    .validator(keywordIdSchema)
    .handler(async ({ data, context: { currentUser } }) => {
        await db
            .delete(keyword)
            .where(and(eq(keyword.id, data.keywordId), eq(keyword.userId, currentUser.id)));
    })
