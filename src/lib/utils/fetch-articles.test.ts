import {describe, expect, test} from "bun:test";
import Database from "bun:sqlite";
import {drizzle} from "drizzle-orm/bun-sqlite";
import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";


const importedArticle = sqliteTable("imported_article", {
    id: integer().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
});


describe("article import transaction", () => {
    test("rolls back synchronous Drizzle writes when a later write fails", () => {
        const sqlite = new Database(":memory:");
        sqlite.run(`
            CREATE TABLE imported_article (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL
            )
        `);
        const testDb = drizzle(sqlite);

        try {
            expect(() => testDb.transaction((tx) => {
                tx.insert(importedArticle).values({ title: "Should roll back" }).run();
                throw new Error("Later import write failed");
            })).toThrow("Later import write failed");

            expect(testDb.select().from(importedArticle).all()).toEqual([]);
        }
        finally {
            sqlite.close();
        }
    });
});
