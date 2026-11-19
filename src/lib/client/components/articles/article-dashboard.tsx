import {cn} from "@/lib/utils/classnames";
import {useEffect, useState} from "react";
import {Toggle} from "@base-ui/react/toggle";
import {Columns2, Square} from "lucide-react";
import {ArticleBulkActions} from "@/lib/types/types";
import {toast} from "@/lib/client/components/ui/toast";
import {useSuspenseQuery} from "@tanstack/react-query";
import {ToggleGroup} from "@base-ui/react/toggle-group";
import {PageTitle} from "@/lib/client/components/page-title";
import {Pagination} from "@/lib/client/components/pagination";
import {buttonVariants} from "@/lib/client/components/ui/button";
import {userArticleListOptions} from "@/lib/client/react-query";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {OptionsMenu} from "@/lib/client/components/articles/options-menu";
import {InputSearch} from "@/lib/client/components/articles/input-search";
import {ArticleCard} from "@/lib/client/components/articles/article-card";
import {KeywordsBadge} from "@/lib/client/components/articles/keywords-badge";
import {EditionButtons} from "@/lib/client/components/articles/edition-buttons";
import {Progress, ProgressLabel, ProgressValue} from "@/lib/client/components/ui/progress";
import {UserArticlesSearch, userArticlesSearchSchema, UserArticleStatus} from "@/lib/schemas/schemas";
import {useArchiveArticles, useDeleteArticles, useRssFetcher} from "@/lib/client/react-query/mutations";


interface ArticleDashboardProps {
    title: string;
    subtitle: string;
    mode: UserArticleStatus;
    filters: UserArticlesSearch;
    onSearchChange: (params: UserArticlesSearch) => Promise<void>;
}


const ARTICLE_COLUMNS_STORAGE_KEY = "sciencefeed.article-columns";
const DEFAULT = { search: "", page: 1, keywordsIds: [] } satisfies ReturnType<typeof userArticlesSearchSchema.parse>;

const columnToggleClassName = buttonVariants({
    size: "icon-xs",
    variant: "ghost",
    className: "data-pressed:bg-accent data-pressed:text-accent-foreground",
});


export function ArticleDashboard({ mode, title, subtitle, filters, onSearchChange }: ArticleDashboardProps) {
    const config = modeConfig[mode];
    const rssFetcherMutation = useRssFetcher();
    const deleteArticlesMutation = useDeleteArticles();
    const archiveArticlesMutation = useArchiveArticles();
    const [isEditing, setIsEditing] = useState(false);
    const [columns, setColumns] = useState<"1" | "2">("2");
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? "");
    const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
    const [activeKeywordsIds, setActiveKeywordsIds] = useState<number[]>(filters.keywordsIds ?? []);
    const { articles, keywords, pagination } = useSuspenseQuery(userArticleListOptions(mode, filters)).data;

    const refreshProgress = rssFetcherMutation.progress;
    const visibleArticleIds = articles.map((article) => article.id);

    const visibleArticleIdsKey = visibleArticleIds.join(",");
    const isBulkActionPending = archiveArticlesMutation.isPending || deleteArticlesMutation.isPending;

    useEffect(() => {
        if (localStorage.getItem(ARTICLE_COLUMNS_STORAGE_KEY) === "1") {
            setColumns("1");
        }
    }, []);

    useEffect(() => {
        setSelectedArticles((prev) => {
            const visibleIds = new Set(visibleArticleIdsKey.split(",").filter(Boolean).map(Number));
            const next = prev.filter((articleId) => visibleIds.has(articleId));

            return next.length === prev.length ? prev : next;
        });
    }, [visibleArticleIdsKey]);

    const onResetClick = async () => {
        setSearchQuery(DEFAULT.search);
        await onSearchChange({ ...DEFAULT, keywordsIds: activeKeywordsIds });
    };

    const onPageChange = async (newPage: number) => {
        setSelectedArticles([]);
        await onSearchChange({ ...filters, page: newPage });
    };

    const onBulkActionClick = (action: ArticleBulkActions) => {
        if (action === "select") {
            setSelectedArticles(visibleArticleIds);
        }
        else if (action === "deselect") {
            setSelectedArticles([]);
        }
        else if (action === "archive") {
            onArchiveClick(selectedArticles, true);
        }
        else if (action === "unarchive") {
            onArchiveClick(selectedArticles, false);
        }
        else if (action === "delete") {
            onDeleteClick(selectedArticles, true);
        }
        else if (action === "restore") {
            onDeleteClick(selectedArticles, false);
        }
    };

    const onEditModeClick = () => {
        setIsEditing(!isEditing);
        setSelectedArticles([]);
    };

    const onSelectionClick = (articleId: number) => {
        setSelectedArticles((prev) => prev.includes(articleId)
            ? prev.filter((id) => id !== articleId)
            : [...prev, articleId]
        );
    };

    const onKeywordClick = async (keywordId: number) => {
        setActiveKeywordsIds((prev) => prev.includes(keywordId)
            ? prev.filter((k) => k !== keywordId)
            : [...prev, keywordId]
        );

        const currentKeywordIds = filters.keywordsIds ?? [];

        await onSearchChange({
            ...filters,
            page: 1,
            keywordsIds: currentKeywordIds.includes(keywordId)
                ? currentKeywordIds.filter((id) => id !== keywordId)
                : [...currentKeywordIds, keywordId],
        });
    };

    const onArchiveClick = (articleIds: number[], archive = mode === "active") => {
        setSelectedArticles([]);
        archiveArticlesMutation.mutate({ data: { articleIds, archive } }, {
            onError: () => {
                return toast.add({ type: "error", title: `Failed to ${archive ? "archive" : "unarchive"} the article(s)` });
            },
        });
    };

    const onDeleteClick = (articleIds: number[], isDeleted = true) => {
        setSelectedArticles([]);
        deleteArticlesMutation.mutate({ data: { articleIds, isDeleted } }, {
            onError: () => {
                return toast.add({ type: "error", title: `Failed to ${isDeleted ? "delete" : "restore"} the article(s)` });
            },
        });
    };

    const onRssFetcherClick = () => {
        rssFetcherMutation.mutate(undefined);
    };

    useDebounceCallback<UserArticlesSearch>(searchQuery, 350, onSearchChange, {
        ...filters,
        page: 1,
        search: searchQuery,
        keywordsIds: activeKeywordsIds,
    });

    const paginationProps = {
        isDisabled: isEditing,
        onChangePage: onPageChange,
        totalPages: pagination.pages,
        currentPage: filters.page ?? DEFAULT.page,
    };

    return (
        <PageTitle title={title} count={pagination.total} subtitle={subtitle}>
            <div>
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <InputSearch
                        search={searchQuery}
                        isDisabled={isEditing}
                        onResetClick={onResetClick}
                        onChange={(ev) => setSearchQuery(ev.target.value)}
                    />
                    <div className="flex items-center gap-3">
                        <OptionsMenu
                            isEditing={isEditing}
                            onEditModeClick={onEditModeClick}
                            showRssFetcher={mode === "active"}
                            onRssFetcherClick={onRssFetcherClick}
                            isRefreshing={rssFetcherMutation.isPending}
                        />
                        {articles.length > 0 &&
                            <ToggleGroup
                                value={[columns]}
                                aria-label="Article columns"
                                className="hidden h-7 shrink-0 items-center gap-0.5 rounded-lg border border-border-subtle
                                bg-surface-muted p-px xl:flex"
                                onValueChange={([value]) => {
                                    if (!value) return;
                                    setColumns(value);
                                    localStorage.setItem(ARTICLE_COLUMNS_STORAGE_KEY, value);
                                }}
                            >
                                <Toggle value="1" aria-label="1 column" title="1 column" className={columnToggleClassName}>
                                    <Square aria-hidden="true"/>
                                </Toggle>
                                <Toggle value="2" aria-label="2 columns" title="2 columns" className={columnToggleClassName}>
                                    <Columns2 aria-hidden="true"/>
                                </Toggle>
                            </ToggleGroup>
                        }
                    </div>
                </div>
                <div role="status" aria-live="polite" aria-atomic="true">
                    {rssFetcherMutation.isPending && refreshProgress &&
                        <div className="mt-4 flex flex-col gap-2 rounded-lg border p-3">
                            <Progress value={refreshProgress.completed} max={refreshProgress.total || 1}>
                                <ProgressLabel>
                                    {refreshProgress.phase === "saving"
                                        ? "Saving matching articles…"
                                        : "Checking feeds…"
                                    }
                                </ProgressLabel>
                                <ProgressValue>
                                    {() => `${refreshProgress.completed} / ${refreshProgress.total} feeds`}
                                </ProgressValue>
                            </Progress>
                            <p className="text-sm text-muted-foreground">
                                {refreshProgress.journal ? `Last checked: ${refreshProgress.journal}. ` : ""}
                                {refreshProgress.failed > 0 ? `${refreshProgress.failed} failed. ` : ""}
                                You can keep browsing.
                            </p>
                        </div>
                    }
                </div>
                <div className="mt-3 grid items-center gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div className="flex min-w-0 flex-wrap gap-2">
                        <KeywordsBadge
                            keywords={keywords}
                            isDisabled={isEditing}
                            onKeywordClick={onKeywordClick}
                            activeKeywordsIds={activeKeywordsIds}
                        />
                    </div>
                    <div className="h-8 min-w-0">
                        <Pagination
                            {...paginationProps}
                            className="mt-0 ml-auto w-fit max-w-full"
                        />
                    </div>
                </div>
                {isEditing &&
                    <EditionButtons
                        selected={selectedArticles}
                        actions={config.bulkActions}
                        totalVisible={articles.length}
                        isPending={isBulkActionPending}
                        onBulkActionClick={onBulkActionClick}
                    />
                }
                {articles.length === 0 ?
                    <div className="mt-10 rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                        {config.empty}
                    </div>
                    :
                    <div className={cn("mt-4 grid grid-cols-1 gap-4", columns === "2" && "xl:grid-cols-2")}>
                        {articles.map((article) =>
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isEditing={isEditing}
                                compact={columns === "1"}
                                selected={selectedArticles}
                                archiveIcon={config.archiveIcon}
                                archiveTitle={config.archiveTitle}
                                onSelectionClick={onSelectionClick}
                                showDeleteAction={config.showDeleteAction}
                                onDeleteClick={onDeleteClick}
                                onArchiveClick={(articleIds) => {
                                    if (mode === "deleted") {
                                        onDeleteClick(articleIds, false);
                                    }
                                    else {
                                        onArchiveClick(articleIds, mode === "active");
                                    }
                                }}
                            />
                        )}
                    </div>
                }
                <div className="mt-11 h-8">
                    <Pagination
                        {...paginationProps}
                        className="mt-0"
                    />
                </div>
            </div>
        </PageTitle>
    );
}


const modeConfig = {
    active: {
        showDeleteAction: true,
        archiveTitle: "Archive",
        empty: "No articles found.",
        archiveIcon: "archive" as const,
        bulkActions: [
            {
                label: "Archive Selected",
                action: "archive" as const,
            },
            {
                label: "Delete Selected",
                action: "delete" as const,
            },
        ],
    },
    archived: {
        showDeleteAction: true,
        archiveTitle: "Unarchive",
        archiveIcon: "restore" as const,
        empty: "No archived articles found.",
        bulkActions: [
            {
                label: "Unarchive Selected",
                action: "unarchive" as const,
            },
            {
                label: "Delete Selected",
                action: "delete" as const,
            },
        ],
    },
    deleted: {
        archiveTitle: "Restore",
        showDeleteAction: false,
        archiveIcon: "restore" as const,
        empty: "No deleted articles found.",
        bulkActions: [
            {
                label: "Restore Selected",
                action: "restore" as const,
            },
        ],
    },
};
