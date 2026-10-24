import {toast} from "@/lib/client/components/ui/toast";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {postGeneralSettings} from "@/lib/server/functions/settings";
import {archiveArticles, deleteArticles} from "@/lib/server/functions/articles";
import {addUserKeyword, deleteUserKeyword, toggleUserKeyword} from "@/lib/server/functions/keywords";
import {authOptions, rssManagerOptions, userKeywordsOptions} from "@/lib/client/react-query/queryOptions";
import {addRssFeedsToUser, createRssFeed, fetchUserRssFeeds, removeRssFeedsFromUser} from "@/lib/server/functions/rss-feeds";


export const useGeneralMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postGeneralSettings,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: authOptions.queryKey });
        },
    });
};


export const useAddKeywordMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addUserKeyword,
        onSuccess: async () => {
            await invalidateKeywordData(queryClient);
        },
    })
}


export const useDeleteKeywordMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUserKeyword,
        onSuccess: async () => {
            await invalidateKeywordData(queryClient);
        },
    })
}


export const useToggleKeywordMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleUserKeyword,
        onSuccess: async () => {
            await invalidateKeywordData(queryClient);
        },
    })
}


export const useCreateRssFeedMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createRssFeed,
        onSuccess: async () => {
            await invalidateRssFeedData(queryClient);
        },
    })
}


export const useRemoveUserRssFeedMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: removeRssFeedsFromUser,
        onSuccess: async () => {
            await invalidateRssFeedData(queryClient);
        },
    })
}


export const useAddRssFeedsToUserMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addRssFeedsToUser,
        onSuccess: async () => {
            await invalidateRssFeedData(queryClient);
        },
    })
}


const invalidateArticleLists = async (queryClient: ReturnType<typeof useQueryClient>) => {
    await queryClient.invalidateQueries({ queryKey: ["userArticles"] });
};


const invalidateKeywordData = async (queryClient: ReturnType<typeof useQueryClient>) => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeywordsOptions.queryKey }),
        invalidateArticleLists(queryClient),
    ]);
};


const invalidateRssFeedData = async (queryClient: ReturnType<typeof useQueryClient>) => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: rssManagerOptions.queryKey }),
        queryClient.invalidateQueries({ queryKey: ["rssSearch"] }),
    ]);
};


export const useArchiveArticles = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: archiveArticles,
        onSuccess: async () => {
            await invalidateArticleLists(queryClient);
        }
    });
}


export const useDeleteArticles = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteArticles,
        onSuccess: async () => {
            await invalidateArticleLists(queryClient);
        }
    });
}


export const useRssFetcher = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: fetchUserRssFeeds,
        onError: () => toast.add({ type: "error", title: "An error occurred while running the RSS Fetcher" }),
        onSuccess: async (data) => {
            await Promise.all([
                invalidateArticleLists(queryClient),
                queryClient.invalidateQueries({ queryKey: authOptions.queryKey }),
                queryClient.invalidateQueries({ queryKey: rssManagerOptions.queryKey }),
            ]);

            if (data) {
                return toast.add({ type: "warning", title: data?.warn });
            }

            toast.add({ type: "success", title: "RSS Fetcher successfully finished" });
        },
    });
}
