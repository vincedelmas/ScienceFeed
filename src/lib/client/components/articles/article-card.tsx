import {UserArticle} from "@/lib/types/types";
import {cn, formatDateTime} from "@/lib/utils/utils";
import {Card} from "@/lib/client/components/ui/card";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {Archive, ExternalLink, RotateCcw, Trash2} from "lucide-react";


interface ArticleCardProps {
    isEditing: boolean,
    selected: number[],
    article: UserArticle,
    deleteTitle?: string,
    archiveTitle?: string,
    showDeleteAction?: boolean,
    showArchiveAction?: boolean,
    archiveIcon?: "archive" | "restore",
    onSelectionClick: (articleId: number) => void,
    onDeleteClick: (articleIds: number[]) => void,
    onArchiveClick: (articleIds: number[]) => void,
}


export const ArticleCard = (props: ArticleCardProps) => {
    const {
        article,
        selected,
        isEditing,
        onDeleteClick,
        onArchiveClick,
        onSelectionClick,
        deleteTitle = "Delete",
        archiveIcon = "archive",
        archiveTitle = "Archive",
        showDeleteAction = true,
        showArchiveAction = true,
    } = props;

    const isSelected = selected.includes(article.id);
    const ArchiveIcon = archiveIcon === "restore" ? RotateCcw : Archive;

    const showActiveDot = !article.isDeleted && !article.isArchived;
    const stateLabel = article.isDeleted ? "Deleted" : article.isArchived ? "Archived" : null;
    const stateDate = article.isDeleted ? article.markedAsDeletedDate : article.markedAsArchivedDate;

    const footerDate = stateLabel && stateDate
        ? `${stateLabel} ${formatDateTime(stateDate, { useLocalTz: true })}`
        : `Added ${formatDateTime(article.addedDate, { useLocalTz: true })}`;

    return (
        <Card
            className={cn("relative max-sm:w-full gap-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated " +
                "p-5 pb-4 text-foreground shadow-none transition-colors hover:border-border-strong",
                isEditing && "cursor-pointer",
                isSelected && "border-primary/70 bg-surface-selected",
            )}
        >
            {isEditing &&
                <>
                    <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => onSelectionClick(article.id)}
                        aria-label={`${isSelected ? "Deselect" : "Select"} article: ${article.title}`}
                        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    />
                    <div className="pointer-events-none absolute left-4 top-4 z-20">
                        <Checkbox
                            tabIndex={-1}
                            aria-hidden="true"
                            checked={isSelected}
                        />
                    </div>
                </>
            }

            <div className={cn("flex min-w-0 items-start gap-3", isEditing && "pl-7")}>
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex min-w-0 items-center gap-2 text-xs">
                        {showActiveDot &&
                            <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full bg-primary"
                            />
                        }
                        <span className="truncate font-semibold text-foreground">
                            {article.journal}
                        </span>
                        {article.publisher &&
                            <>
                                <span className="text-foreground-subtle" aria-hidden="true">·</span>
                                <span className="truncate text-foreground-subtle">
                                    {article.publisher}
                                </span>
                            </>
                        }
                    </div>
                    <h2 className="text-base font-semibold leading-snug text-foreground">
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href={isEditing ? undefined : article.link}
                            onClick={(ev) => ev.stopPropagation()}
                            className={cn("line-clamp-2", !isEditing && "hover:underline")}
                        >
                            {article.title}
                        </a>
                    </h2>
                </div>

                <a
                    target="_blank"
                    title="Open article"
                    rel="noopener noreferrer"
                    href={isEditing ? undefined : article.link}
                    onClick={(ev) => ev.stopPropagation()}
                    aria-label={`Open article in a new tab: ${article.title}`}
                    className={cn(
                        "mt-1 shrink-0 rounded-md p-1 text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:mt-11",
                        isEditing && "pointer-events-none opacity-40",
                    )}
                >
                    <ExternalLink className="size-4" aria-hidden="true"/>
                </a>
            </div>

            <p className="mt-5 line-clamp-3 text-sm leading-6 text-foreground-muted">
                {article.summary}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
                {article.keywords.map((keyword) =>
                    <Badge
                        key={keyword}
                        variant="secondary"
                        className="rounded-full border-0 bg-primary/15 px-2.5 py-0.5 text-[11px] font-medium text-primary shadow-none"
                    >
                        {keyword}
                    </Badge>
                )}
            </div>

            <div className="mt-4 border-t border-border-subtle pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="min-w-0 truncate text-xs text-foreground-muted">
                        {footerDate}
                    </span>
                    <div className="flex shrink-0 items-center justify-end gap-1">
                        {showArchiveAction &&
                            <Button
                                size="icon"
                                variant="ghost"
                                title={archiveTitle}
                                disabled={isEditing}
                                aria-label={`${archiveTitle} article: ${article.title}`}
                                className="size-8 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    onArchiveClick([article.id]);
                                }}
                            >
                                <ArchiveIcon className="size-4" aria-hidden="true"/>
                            </Button>
                        }
                        {showDeleteAction &&
                            <Button
                                size="icon"
                                variant="ghost"
                                title={deleteTitle}
                                disabled={isEditing}
                                aria-label={`${deleteTitle} article: ${article.title}`}
                                className="size-8 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
                                onClick={(ev) => {
                                    ev.stopPropagation();
                                    onDeleteClick([article.id]);
                                }}
                            >
                                <Trash2 className="size-4" aria-hidden="true"/>
                            </Button>
                        }
                    </div>
                </div>
            </div>
        </Card>
    );
};
