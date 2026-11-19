import {queryOptions} from "@tanstack/react-query";
import {getCurrentUser} from "@/lib/server/functions/auth";
import {getUserKeywords} from "@/lib/server/functions/keywords";
import {getUserArticles} from "@/lib/server/functions/articles";
import {UserArticlesSearch, UserArticleStatus} from "@/lib/schemas/schemas";
import {getUserRssFeeds, rssFeedSearch} from "@/lib/server/functions/rss-feeds";


export const authOptions = queryOptions({
    queryKey: ["currentUser"] as const,
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
});


export const userArticleListOptions = (status: UserArticleStatus, search: UserArticlesSearch) => queryOptions({
    queryKey: ["userArticles", status, search] as const,
    queryFn: () => getUserArticles({ data: { ...search, status } }),
});


export const userKeywordsOptions = queryOptions({
    queryKey: ["keywords"] as const,
    queryFn: () => getUserKeywords(),
});


export const rssManagerOptions = queryOptions({
    queryKey: ["rssManager"] as const,
    queryFn: () => getUserRssFeeds(),
});


export const rssSearchOptions = (query: string) => queryOptions({
    queryKey: ["rssSearch", query] as const,
    queryFn: () => rssFeedSearch({ data: { query: query.trim() } }),
    staleTime: 2 * 60 * 1000,
    enabled: query.trim().length >= 2,
});
