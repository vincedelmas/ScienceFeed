#!/usr/bin/env bun
import {Command} from "commander";
import {fetchAndFilterArticles} from "@/lib/utils/fetch-articles";
import {seedDatabaseWithRssFeeds} from "@/lib/utils/seed-database";
import {cleanupDeletedArticles} from "@/lib/server/functions/cleanup";


const program = new Command();


program
    .name("science-feed")
    .description("ScienceFeed maintenance CLI")
    .version("1.0.0");


program
    .command("cleanup-deleted-articles")
    .description("Delete old soft-deleted user articles and orphan global articles")
    .option("-d, --retention-days <days>", "days to keep deleted user-article tombstones")
    .action(async (options: { retentionDays?: string }) => {
        const retentionDays = Number(options.retentionDays ?? process.env.DELETED_ARTICLE_RETENTION_DAYS ?? "180");

        if (!Number.isInteger(retentionDays) || retentionDays < 1) {
            throw new Error("Retention days must be a positive integer.");
        }

        const result = await cleanupDeletedArticles(retentionDays);

        console.log(`Deleted ${result.deletedUserArticles} soft-deleted user article(s) older than ${result.retentionDays} days.`);
        console.log(`Deleted ${result.deletedOrphanArticles} orphan article(s) with no user article references.`);
    });


program
    .command("seed-rss-feeds")
    .description("Seed or update the bundled RSS feed catalog")
    .action(async () => {
        const seededFeeds = await seedDatabaseWithRssFeeds();
        console.log(`Seeded or updated ${seededFeeds} RSS feed(s).`);
    });


program
    .command("fetch-rss-feeds")
    .description("Fetch and filter RSS feeds for all users")
    .action(async () => {
        const result = await fetchAndFilterArticles();

        console.log(`Processed ${result.processedFeeds} RSS feed(s).`);

        if (result.failedFeeds.length > 0) {
            console.log(`Failed to fetch ${result.failedFeeds.length} RSS feed(s):`);

            for (const feed of result.failedFeeds) {
                console.log(`- ${feed.publisher} - ${feed.journal} (${feed.url}): ${feed.error}`);
            }
        }
    });


await program.parseAsync();
