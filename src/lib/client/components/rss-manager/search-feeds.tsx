import {toast} from "sonner";
import React, {useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {SearchRssFeed} from "@/lib/types/types";
import {Input} from "@/lib/client/components/ui/input";
import {rssSearchOptions} from "@/lib/client/react-query";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {CheckCircle, Loader2, Plus, Search} from "lucide-react";
import {useOnClickOutside} from "@/lib/client/hooks/use-clicked-outside";
import {useAddRssFeedsToUserMutation} from "@/lib/client/react-query/mutations";


export function SearchRSSFeeds() {
    const commandRef = useRef(null);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(search, 350);
    const addRssFeedsMutation = useAddRssFeedsToUserMutation();
    const { data, isLoading, error } = useQuery(rssSearchOptions(debouncedQuery));
    const [pendingFeedId, setPendingFeedId] = useState<number | null>(null);

    const handleAddRssFeed = (rssFeed: SearchRssFeed) => {
        if (rssFeed.isActive || pendingFeedId !== null) return;

        setPendingFeedId(rssFeed.id);
        addRssFeedsMutation.mutate({ data: { feedsIds: [rssFeed.id] } }, {
            onError: () => {
                setPendingFeedId(null);
                toast.error("Failed to add this RSS Feed");
            },
            onSuccess: () => {
                setPendingFeedId(null);
                toast.success("RSS Feed successfully added");
            },
        });
    };

    const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setIsOpen(true);
        setSearch(ev.target.value);
    };

    const resetSearch = () => {
        setSearch("");
        setIsOpen(false);
    };

    useOnClickOutside(commandRef, resetSearch);

    return (
        <div ref={commandRef} className="relative w-full sm:w-100 sm:max-w-full">
            <div className="relative">
                <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                    type="search"
                    value={search}
                    className="pl-9"
                    onChange={handleInputChange}
                    aria-label="Search RSS feeds"
                    placeholder="Search RSS feeds..."
                    onFocus={() => setIsOpen(true)}
                />
            </div>
            {isOpen && (debouncedQuery.length >= 2 || isLoading) &&
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated shadow-xl">
                    <div className="max-h-90 overflow-y-auto p-1" aria-live="polite">
                        {isLoading &&
                            <div className="flex items-center justify-center gap-2 p-4 text-sm text-foreground-muted" role="status">
                                <Loader2 className="size-5 animate-spin" aria-hidden="true"/>
                                Searching feeds...
                            </div>
                        }
                        {error &&
                            <p className="p-4 text-center text-sm text-foreground-muted">
                                {error.message === "429"
                                    ? "Too many requests. Please wait a bit and try again."
                                    : "An error occurred. Please try again."
                                }
                            </p>
                        }
                        {data && data.length === 0 &&
                            <p className="p-4 text-center text-sm text-foreground-muted">
                                No results found.
                            </p>
                        }
                        {data && data.length > 0 &&
                            data.map((rssFeed) =>
                                <SearchComponent
                                    key={rssFeed.id}
                                    rssFeed={rssFeed}
                                    handleAddRssFeed={handleAddRssFeed}
                                    isPending={pendingFeedId === rssFeed.id}
                                />
                            )}
                    </div>
                </div>
            }
        </div>
    );
}


interface SearchComponentProps {
    isPending: boolean;
    rssFeed: SearchRssFeed;
    handleAddRssFeed: (rssFeed: SearchRssFeed) => void;
}


function SearchComponent({ rssFeed, isPending, handleAddRssFeed }: SearchComponentProps) {
    const isDisabled = rssFeed.isActive || isPending;
    const accessibleLabel = isPending
        ? `Adding ${rssFeed.journal}`
        : rssFeed.isActive
            ? `${rssFeed.journal} is already added`
            : `Add ${rssFeed.journal} by ${rssFeed.publisher}`;

    return (
        <button
            type="button"
            disabled={isDisabled}
            aria-label={accessibleLabel}
            onClick={() => handleAddRssFeed(rssFeed)}
            className="flex w-full cursor-pointer rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-hover
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:opacity-50"
        >
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2 text-xs text-foreground-muted">
                        <span className="truncate font-medium" title={rssFeed.publisher}>
                            {rssFeed.publisher}
                        </span>
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-foreground-soft" title={rssFeed.journal}>
                        {rssFeed.journal}
                    </div>
                </div>
                <div className="shrink-0">
                    {isPending
                        ? <Loader2 className="size-4 animate-spin text-foreground-muted" aria-hidden="true"/>
                        : rssFeed.isActive
                            ? <CheckCircle className="size-4 text-success" aria-hidden="true"/>
                            : <Plus className="size-4 text-primary" aria-hidden="true"/>
                    }
                </div>
            </div>
        </button>
    );
}
