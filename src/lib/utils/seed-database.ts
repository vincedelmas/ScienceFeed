import {join} from "path";
import {sql} from "drizzle-orm";
import {readFile} from "fs/promises";
import {db} from "@/lib/server/database/db";
import {rssFeed as rssFeedTable} from "@/lib/server/database/schema";


type RSSToSeed = {
    url: string,
    journal: string,
    publisher: string,
}[];


export const seedDatabaseWithRssFeeds = async () => {
    const rssFeedsAsString = await readFile(join(process.cwd(), "public", "static", "seed-rss-feeds.json"), "utf-8");

    const rssFeedsToSeed: { data: RSSToSeed } = JSON.parse(rssFeedsAsString);
    if (rssFeedsToSeed.data.length > 0) {
        db
            .insert(rssFeedTable)
            .values(rssFeedsToSeed.data)
            .onConflictDoUpdate({
                target: rssFeedTable.url,
                set: {
                    journal: sql`excluded.journal`,
                    publisher: sql`excluded.publisher`,
                },
            }).run();
    }

    return rssFeedsToSeed.data.length;
};
