DELETE FROM `user_article_keyword`
WHERE `keyword_id` IS NULL
    OR `user_article_id` IS NULL
    OR `keyword_id` NOT IN (SELECT `id` FROM `keyword`)
    OR `user_article_id` NOT IN (SELECT `id` FROM `user_article`);--> statement-breakpoint
CREATE TABLE `__new_user_article_keyword` (
	`keyword_id` integer NOT NULL,
	`user_article_id` integer NOT NULL,
	FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_article_id`) REFERENCES `user_article`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
INSERT INTO `__new_user_article_keyword` (`keyword_id`, `user_article_id`)
SELECT `keyword_id`, `user_article_id`
FROM `user_article_keyword`;--> statement-breakpoint
DROP TABLE `user_article_keyword`;--> statement-breakpoint
ALTER TABLE `__new_user_article_keyword` RENAME TO `user_article_keyword`;--> statement-breakpoint
CREATE UNIQUE INDEX `ux_user_article_keyword_article_keyword`
ON `user_article_keyword` (`user_article_id`, `keyword_id`);
