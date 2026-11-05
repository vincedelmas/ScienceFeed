import {useEffect, useState} from "react";
import {RSS_REFRESH_COOLDOWN_MINUTES} from "@/lib/utils/constants";
import {formatDateTime, parseDateInput} from "@/lib/utils/date";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {FileEdit, Loader2, Rss} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/client/components/ui/tooltip";


interface OptionsMenuProps {
    isEditing: boolean;
    isRefreshing: boolean;
    showRssFetcher?: boolean;
    onEditModeClick: () => void;
    onRssFetcherClick: () => void;
}


export const OptionsMenu = ({ isEditing, onEditModeClick, onRssFetcherClick, isRefreshing, showRssFetcher = true }: OptionsMenuProps) => {
    const { currentUser } = useAuth();
    const [now, setNow] = useState(Date.now);
    const nextRefreshAt = currentUser?.lastRssUpdate
        ? parseDateInput(currentUser.lastRssUpdate).getTime() + RSS_REFRESH_COOLDOWN_MINUTES * 60_000
        : 0;
    const remainingMinutes = Math.max(0, Math.ceil((nextRefreshAt - now) / 60_000));

    useEffect(() => {
        if (!showRssFetcher) return;
        const interval = setInterval(() => setNow(Date.now()), 15_000);
        return () => clearInterval(interval);
    }, [showRssFetcher]);

    const lastRssUpdate = formatDateTime(currentUser?.lastRssUpdate, { includeTime: true, useLocalTz: true });

    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button size="sm" onClick={onEditModeClick} variant="outline" className="w-full sm:w-auto">
                <FileEdit className="size-3.5 mr-1"/> {isEditing ? "Exit Bulk Mode" : "Bulk Edit"}
            </Button>
            {showRssFetcher && (
                <Tooltip onOpenChange={(open) => {
                    if (open) setNow(Date.now());
                }}>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="outline"
                                aria-busy={isRefreshing}
                                onClick={onRssFetcherClick}
                                className="w-full sm:w-auto"
                                disabled={isEditing || isRefreshing || remainingMinutes > 0}
                                focusableWhenDisabled
                            />
                        }
                    >
                        {isRefreshing
                            ? <Loader2 className="size-3.5 mr-1 animate-spin" aria-hidden="true"/>
                            : <Rss className="size-3.5 mr-1" aria-hidden="true"/>
                        }
                        {isRefreshing
                            ? "Updating feeds…"
                            : "Update Feeds"
                        }
                    </TooltipTrigger>
                    <TooltipContent side="top" align="end" className="text-sm">
                        <div className="flex flex-col gap-1">
                            <span>Last update: {lastRssUpdate}</span>
                            <span>
                                {remainingMinutes > 0
                                    ? `You can refresh again in ${remainingMinutes} ${remainingMinutes === 1 ? "minute" : "minutes"}.`
                                    : "You can refresh now."}
                            </span>
                        </div>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
