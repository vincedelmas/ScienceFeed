import type {rssManagerOptions, rssSearchOptions, userArticleListOptions, userKeywordsOptions} from "@/lib/client/react-query";


export type ArticleBulkActions = "select" | "deselect" | "unread" | "archive" | "unarchive" | "delete" | "restore";

export type UserRssFeed = Awaited<ReturnType<NonNullable<typeof rssManagerOptions.queryFn>>>[number];
export type UserKeyword = Awaited<ReturnType<NonNullable<typeof userKeywordsOptions.queryFn>>>[number];
export type SearchRssFeed = Awaited<ReturnType<NonNullable<ReturnType<typeof rssSearchOptions>["queryFn"]>>>[number];
export type UserArticle = Awaited<ReturnType<NonNullable<ReturnType<typeof userArticleListOptions>["queryFn"]>>>["articles"][number];
