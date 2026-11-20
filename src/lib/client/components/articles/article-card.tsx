import {cn} from "@/lib/utils/classnames";
import {formatDateTime} from "@/lib/utils/date";
import type {UserArticle} from "@/lib/types/types";
import {Card} from "@/lib/client/components/ui/card";
import {toast} from "@/lib/client/components/ui/toast";
import {Button} from "@/lib/client/components/ui/button";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {parseFeedPublicationDetails} from "@/lib/utils/feed-summary";
import {Archive, Copy, ExternalLink, RotateCcw, Trash2} from "lucide-react";
import {ArticleSummary} from "@/lib/client/components/articles/article-summary";
import {ArticleKeywords} from "@/lib/client/components/articles/article-keywords";


interface ArticleCardProps {
    compact: boolean,
    isEditing: boolean,
    selected: number[],
    article: UserArticle,
    archiveTitle?: string,
    showDeleteAction?: boolean,
    archiveIcon?: "archive" | "restore",
    onSelectionClick: (articleId: number) => void,
    onDeleteClick: (articleIds: number[]) => void,
    onArchiveClick: (articleIds: number[]) => void,
}


export const ArticleCard = (props: ArticleCardProps) => {
    const {
        article, compact, selected, isEditing, onDeleteClick, onArchiveClick,
        onSelectionClick, archiveIcon = "archive", archiveTitle = "Archive", showDeleteAction = true,
    } = props;

    const { doi } = article;
    const isSelected = selected.includes(article.id);
    const ArchiveIcon = archiveIcon === "restore" ? RotateCcw : Archive;

    const showActiveDot = !article.isDeleted && !article.isArchived;
    const stateLabel = article.isDeleted ? "Deleted" : article.isArchived ? "Archived" : null;
    const stateDate = article.isDeleted ? article.markedAsDeletedDate : article.markedAsArchivedDate;

    const footerDate = stateLabel && stateDate
        ? `${stateLabel} ${formatDateTime(stateDate, { useLocalTz: true })}`
        : `Added ${formatDateTime(article.addedDate, { useLocalTz: true })}`;

    const publication = parseFeedPublicationDetails(article.summary);
    const authors = article.authors ?? publication?.authors;

    // Older imports could join section heading to first word
    const summary = publication
        ? `Publication date: ${publication.publicationDate}`
        : article.summary.replace(/^(Abstract|Conspectus)(?=[A-Z])/, "$1: ");

    return (
        <Card
            className={cn("relative h-82 min-w-0 max-sm:w-full gap-0 overflow-hidden rounded-xl border border-border-strong/60 " +
                "bg-surface-elevated p-4 pb-0 text-foreground shadow-none ring-0 transition-colors hover:border-border-strong sm:px-5",
                compact && "xl:h-77",
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
                        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset
                        focus-visible:ring-primary"
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

            <div className={cn("min-w-0 shrink-0", !summary && "mb-4", isEditing && "pl-7")}>
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs">
                        {showActiveDot &&
                            <span
                                aria-hidden="true"
                                className="size-2 shrink-0 rounded-full bg-primary"
                            />
                        }
                        <span className="truncate font-semibold text-primary">
                            {article.journal}
                        </span>
                        {article.publisher &&
                            <>
                                <span className="text-foreground-subtle" aria-hidden="true">·</span>
                                <span className="truncate text-foreground-muted">
                                    {article.publisher}
                                </span>
                            </>
                        }
                    </div>

                    <a
                        target="_blank"
                        title="Open article"
                        rel="noopener noreferrer"
                        href={isEditing ? undefined : article.link}
                        onClick={(ev) => ev.stopPropagation()}
                        aria-label={`Open article in a new tab: ${article.title}`}
                        className={cn("shrink-0 rounded-md p-1 text-foreground-muted transition-colors hover:bg-surface-hover " +
                            "hover:text-foreground", isEditing && "pointer-events-none opacity-40")}
                    >
                        <ExternalLink className="size-4" aria-hidden="true"/>
                    </a>
                </div>

                <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
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
                {authors &&
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-foreground-soft">
                        <span className="font-semibold text-primary">
                            Authors:
                        </span>
                        {" "}{authors}
                    </p>
                }
            </div>

            {summary &&
                <ArticleSummary
                    summary={summary}
                />
            }

            {doi &&
                <Button
                    size="sm"
                    type="button"
                    variant="ghost"
                    disabled={isEditing}
                    title={`Copy DOI ${doi}`}
                    aria-label={`Copy DOI ${doi}`}
                    className="mt-auto mb-2 min-w-0 max-w-full self-start"
                    onClick={async () => {
                        try {
                            await navigator.clipboard.writeText(doi);
                            toast.add({ type: "success", title: "DOI copied" });
                        }
                        catch {
                            toast.add({ type: "error", title: "Could not copy DOI" });
                        }
                    }}
                >
                    <Copy data-icon="inline-start" aria-hidden="true"/>
                    <span className="truncate">
                        DOI: {doi}
                    </span>
                </Button>
            }

            <div className={cn("-mx-4 flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle " +
                "bg-surface-muted/50 px-4 py-2 sm:-mx-5 sm:px-5", !doi && "mt-auto")}>
                <div className="flex h-8 min-w-0 flex-1 items-center gap-2">
                    <span
                        title={footerDate}
                        className={cn("truncate text-xs text-foreground-muted", article.keywords.length > 0 && "max-w-3/5")}
                    >
                        {footerDate}
                    </span>
                    {article.keywords.length > 0 &&
                        <>
                            <span aria-hidden="true" className="shrink-0 text-muted-foreground">•</span>
                            <ArticleKeywords keywords={article.keywords} isEditing={isEditing}/>
                        </>
                    }
                </div>
                <div className="flex shrink-0 items-center gap-1">
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
                    {showDeleteAction &&
                        <Button
                            size="icon"
                            title="Delete"
                            variant="ghost"
                            disabled={isEditing}
                            aria-label={`Delete article: ${article.title}`}
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
        </Card>
    );
};
