import {navigation} from "@/lib/client/components/dashboard/navigation";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {rssManagerOptions} from "@/lib/client/react-query";
import {PageTitle} from "@/lib/client/components/page-title";
import {DisplayFeeds} from "@/lib/client/components/rss-manager/display-feeds";
import {SearchRSSFeeds} from "@/lib/client/components/rss-manager/search-feeds";
import {CreateNewRSSFeed} from "@/lib/client/components/rss-manager/create-feed";


export const Route = createFileRoute("/_private/rss-manager")({
    staticData: {navigation: navigation.feeds},
    loader: ({ context: { queryClient } }) => {
        return queryClient.query({ ...rssManagerOptions, staleTime: "static" });
    },
    component: RssManager,
});


function RssManager() {
    const userRssFeeds = useSuspenseQuery(rssManagerOptions).data;
    const publisherCount = new Set(userRssFeeds.map((feed) => feed.publisher)).size;

    return (
        <PageTitle title="RSS Feeds Manager" subtitle="Search and Manage your RSS feeds.">
            <div className="mt-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                    <SearchRSSFeeds/>
                    <CreateNewRSSFeed/>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-foreground-muted">
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
                        {userRssFeeds.length} feeds
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
                        {publisherCount} publishers
                    </span>
                </div>
            </div>
            <DisplayFeeds
                userRssFeeds={userRssFeeds}
            />
        </PageTitle>
    );
}
