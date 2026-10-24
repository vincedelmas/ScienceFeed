import React, {useState} from "react";
import {UserRssFeed} from "@/lib/types/types";
import {formatDateTime} from "@/lib/utils/utils";
import {toast} from "@/lib/client/components/ui/toast";
import {AlertTriangle, Rss, Trash2} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {useRemoveUserRssFeedMutation} from "@/lib/client/react-query/mutations";


export function DisplayFeeds({ userRssFeeds }: { userRssFeeds: UserRssFeed[]; }) {
    const removeUserRssFeedMutation = useRemoveUserRssFeedMutation();
    const [removingFeedId, setRemovingFeedId] = useState<number | null>(null);

    const handleRemoveRssFeed = (rssFeed: UserRssFeed) => {
        if (removingFeedId !== null) return;

        setRemovingFeedId(rssFeed.id);
        removeUserRssFeedMutation.mutate({ data: { rssIds: [rssFeed.id] } }, {
            onError: () => {
                setRemovingFeedId(null);
                toast.add({ type: "error", title: "Failed to remove this RSS Feed" });
            },
            onSuccess: () => {
                setRemovingFeedId(null);
                toast.add({ type: "success", title: "RSS Feed successfully removed" });
            },
        });
    };

    const sortedRssFeeds = [...userRssFeeds].sort((a, b) => {
        const publisherComp = a.publisher.localeCompare(b.publisher);
        if (publisherComp !== 0) return publisherComp;
        return a.journal.localeCompare(b.journal);
    });

    const groupedRssFeeds = sortedRssFeeds.reduce<Record<string, UserRssFeed[]>>((acc, feed) => {
        const publisher = feed.publisher;
        if (!acc[publisher]) acc[publisher] = [];
        acc[publisher].push(feed);
        return acc;
    }, {});

    return (
        <div className="mt-6 space-y-4">
            {userRssFeeds.length === 0 &&
                <div className="rounded-lg border border-dashed border-border-subtle py-10 text-center text-sm text-foreground-muted">
                    No RSS feeds added yet.
                </div>
            }
            {Object.entries(groupedRssFeeds).map(([publisher, feeds]) => (
                <section key={publisher} className="rounded-lg border border-border-subtle bg-surface">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-foreground-soft">
                                {publisher}
                            </h3>
                            <p className="text-xs text-foreground-muted">
                                {feeds.length} {feeds.length === 1 ? "feed" : "feeds"}
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-border-subtle">
                        {feeds.map((feed) =>
                            <div key={feed.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-hover">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="mt-0.5 rounded-md border border-primary/20 bg-primary/10 p-2 text-primary">
                                        <Rss className="size-4"/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground-soft" title={feed.journal}>
                                            {feed.journal}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-foreground-subtle" title={feed.url}>
                                            {feed.url}
                                        </p>
                                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground-muted">
                                            <span>
                                                Last fetch: {feed.lastFetchDate ? formatDateTime(feed.lastFetchDate, { includeTime: true, useLocalTz: true }) : "Not fetched yet"}
                                            </span>
                                            {feed.lastFetchError &&
                                                <span title={feed.lastFetchError} className="inline-flex min-w-0 items-center gap-1 text-amber-500">
                                                    <AlertTriangle className="size-3.5 shrink-0"/>
                                                    <span className="truncate">Fetch failed</span>
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Remove RSS Feed"
                                    disabled={removingFeedId !== null}
                                    onClick={() => handleRemoveRssFeed(feed)}
                                    aria-label={`Remove RSS feed: ${feed.journal}`}
                                    className="size-9 shrink-0 text-foreground-muted hover:bg-danger-muted hover:text-danger-foreground sm:size-8"
                                >
                                    {removingFeedId === feed.id
                                        ? <span className="size-4 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent"/>
                                        : <Trash2 className="size-4"/>
                                    }
                                </Button>
                            </div>
                        )}
                    </div>
                </section>
            ))}
        </div>
    );
}
