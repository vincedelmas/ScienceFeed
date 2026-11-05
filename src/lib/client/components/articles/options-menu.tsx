import {formatDateTime} from "@/lib/utils/utils";
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
    const lastRssUpdate = formatDateTime(currentUser?.lastRssUpdate, { includeTime: true, useLocalTz: true });

    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button size="sm" onClick={onEditModeClick} variant="outline" className="w-full sm:w-auto">
                <FileEdit className="size-3.5 mr-1"/> {isEditing ? "Exit Bulk Mode" : "Bulk Edit"}
            </Button>
            {showRssFetcher && (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                size="sm"
                                variant="outline"
                                aria-busy={isRefreshing}
                                onClick={onRssFetcherClick}
                                className="w-full sm:w-auto"
                                disabled={isEditing || isRefreshing}
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
                        Last update: {lastRssUpdate}
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
