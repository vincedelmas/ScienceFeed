import {describe, expect, test} from "bun:test";
import Database from "bun:sqlite";
import {sql} from "drizzle-orm";
import {drizzle} from "drizzle-orm/bun-sqlite";
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";


const articleKeyword = sqliteTable("article_keyword", {
    articleId: integer("article_id").notNull(),
    name: text().notNull(),
});


describe("article keyword aggregation", () => {
    test("preserves commas inside keyword names", () => {
        const sqlite = new Database(":memory:");
        sqlite.run("CREATE TABLE article_keyword (article_id INTEGER NOT NULL, name TEXT NOT NULL)");
        const testDb = drizzle(sqlite);

        try {
            testDb.insert(articleKeyword).values([
                { articleId: 1, name: "chemistry, organic" },
                { articleId: 1, name: "catalysis" },
            ]).run();

            const row = testDb
                .select({
                    keywords: sql<string[]>`json_group_array(distinct ${articleKeyword.name})`
                        .mapWith((value: string) => JSON.parse(value) as string[]),
                })
                .from(articleKeyword)
                .get();

            expect(row?.keywords).toEqual(["chemistry, organic", "catalysis"]);
        }
        finally {
            sqlite.close();
        }
    });
});
