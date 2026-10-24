import {FileEdit, Rss} from "lucide-react";
import {formatDateTime} from "@/lib/utils/utils";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Button} from "@/lib/client/components/ui/button";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/client/components/ui/tooltip";


interface OptionsMenuProps {
    isEditing: boolean;
    showRssFetcher?: boolean;
    onEditModeClick: () => void;
    onRssFetcherClick: () => void;
}


export const OptionsMenu = ({ isEditing, onEditModeClick, onRssFetcherClick, showRssFetcher = true }: OptionsMenuProps) => {
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
                                disabled={isEditing}
                                onClick={onRssFetcherClick}
                                className="w-full sm:w-auto"
                            />
                        }
                    >
                        <Rss className="size-3.5 mr-1"/> Update Feeds
                    </TooltipTrigger>
                    <TooltipContent side="top" align="end" className="text-sm">
                        <div>
                            {`Last update: ${lastRssUpdate}`}
                        </div>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
