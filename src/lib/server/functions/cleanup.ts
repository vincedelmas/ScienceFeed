import {db} from "@/lib/server/database/db";
import {and, eq, lt, sql} from "drizzle-orm";
import {article, userArticle} from "@/lib/server/database/schema";


export async function cleanupDeletedArticles(retentionDays = 180) {
    const safeRetentionDays = Math.max(1, Math.floor(retentionDays));

    const deletedRows = await db
        .delete(userArticle)
        .where(and(
            eq(userArticle.isDeleted, true),
            lt(
                sql`coalesce(${userArticle.markedAsDeletedDate}, ${userArticle.addedDate})`,
                sql`datetime('now', ${`-${safeRetentionDays} days`})`,
            ),
        )).returning({ id: userArticle.id });

    const deletedArticles = await db
        .delete(article)
        .where(sql`not exists (
            select 1
            from ${userArticle}
            where ${userArticle.articleId} = ${article.id}
        )`).returning({ id: article.id });

    return {
        retentionDays: safeRetentionDays,
        deletedUserArticles: deletedRows.length,
        deletedOrphanArticles: deletedArticles.length,
    };
}
