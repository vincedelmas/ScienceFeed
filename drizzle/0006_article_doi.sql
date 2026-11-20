ALTER TABLE `article` ADD `doi` text;--> statement-breakpoint
ALTER TABLE `article` ADD `crossref_fetched` integer DEFAULT false NOT NULL;