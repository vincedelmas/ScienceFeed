import {cn} from "@/lib/utils/classnames";
import {ArticleBulkActions} from "@/lib/types/types";
import {Button} from "@/lib/client/components/ui/button";


interface EditionButtonsProps {
    selected: number[];
    isPending?: boolean;
    totalVisible: number;
    onBulkActionClick: (action: ArticleBulkActions) => void;
    actions?: {
        label: string;
        action: ArticleBulkActions;
    }[];
}


export const EditionButtons = ({ selected, totalVisible, isPending = false, actions = defaultActions, onBulkActionClick }: EditionButtonsProps) => {
    const hasArticles = totalVisible > 0;
    const allVisibleSelected = hasArticles && selected.length === totalVisible;
    const selectedLabel = hasArticles ? `${selected.length} / ${totalVisible} selected` : "0 selected";

    const handleSelectAction = () => {
        onBulkActionClick(allVisibleSelected ? "deselect" : "select");
    };

    return (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-foreground-soft">
                    Bulk edit
                </span>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-foreground-muted">
                    {selectedLabel}
                </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSelectAction}
                    disabled={!hasArticles || isPending}
                    className="h-8 w-full border border-primary/30 bg-primary/15 px-3 text-primary hover:bg-primary/25 hover:text-primary sm:w-auto"
                >
                    {allVisibleSelected ? "Deselect All" : "Select All"}
                </Button>
                {actions.map((action) =>
                    <Button
                        size="sm"
                        variant="ghost"
                        key={action.action}
                        disabled={selected.length === 0 || isPending}
                        onClick={() => onBulkActionClick(action.action)}
                        className={cn(
                            "h-8 w-full border border-border-strong bg-transparent px-3 text-foreground-soft hover:bg-surface-hover hover:text-foreground sm:w-auto",
                            action.action === "delete" && "text-danger-foreground hover:bg-danger-muted hover:text-danger-foreground",
                        )}
                    >
                        {action.label}
                    </Button>
                )}
            </div>
        </div>
    );
};


const defaultActions: NonNullable<EditionButtonsProps["actions"]> = [
    {
        action: "archive",
        label: "Archive Selected",
    },
    {
        action: "delete",
        label: "Delete Selected",
    },
];
