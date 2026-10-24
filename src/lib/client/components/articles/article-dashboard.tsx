import {cn} from "@/lib/utils/utils";
import {useEffect, useState} from "react";
import {ArticleBulkActions} from "@/lib/types/types";
import {toast} from "@/lib/client/components/ui/toast";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/page-title";
import {Pagination} from "@/lib/client/components/pagination";
import {userArticleListOptions} from "@/lib/client/react-query";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {OptionsMenu} from "@/lib/client/components/articles/options-menu";
import {InputSearch} from "@/lib/client/components/articles/input-search";
import {ArticleCard} from "@/lib/client/components/articles/article-card";
import {KeywordsBadge} from "@/lib/client/components/articles/keywords-badge";
import {EditionButtons} from "@/lib/client/components/articles/edition-buttons";
import {UserArticlesSearch, userArticlesSearchSchema, UserArticleStatus} from "@/lib/schemas/schemas";
import {useArchiveArticles, useDeleteArticles, useRssFetcher} from "@/lib/client/react-query/mutations";


interface ArticleDashboardProps {
    title: string;
    subtitle: string;
    mode: UserArticleStatus;
    filters: UserArticlesSearch;
    onSearchChange: (params: UserArticlesSearch) => Promise<void>;
}


const DEFAULT = { search: "", page: 1, keywordsIds: [] } satisfies ReturnType<typeof userArticlesSearchSchema.parse>;


export function ArticleDashboard({ mode, title, subtitle, filters, onSearchChange }: ArticleDashboardProps) {
    const config = modeConfig[mode];
    const rssFetcherMutation = useRssFetcher();
    const deleteArticlesMutation = useDeleteArticles();
    const archiveArticlesMutation = useArchiveArticles();
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search ?? "");
    const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
    const apiData = useSuspenseQuery(userArticleListOptions(mode, filters)).data;
    const [activeKeywordsIds, setActiveKeywordsIds] = useState<number[]>(filters.keywordsIds ?? []);
    const visibleArticleIds = apiData.articles.map((article) => article.id);

    const visibleArticleIdsKey = visibleArticleIds.join(",");
    const isBulkActionPending = archiveArticlesMutation.isPending || deleteArticlesMutation.isPending;

    useEffect(() => {
        setSelectedArticles((prev) => {
            const visibleIds = new Set(visibleArticleIdsKey.split(",").filter(Boolean).map(Number));
            const next = prev.filter((articleId) => visibleIds.has(articleId));

            return next.length === prev.length ? prev : next;
        });
    }, [visibleArticleIdsKey]);

    const fetchData = async (params: UserArticlesSearch) => {
        await onSearchChange(params);
    };

    const onResetClick = async () => {
        setSearchQuery(DEFAULT.search);
        await fetchData({ ...DEFAULT, keywordsIds: activeKeywordsIds });
    };

    const onPageChange = async (newPage: number) => {
        setSelectedArticles([]);
        await fetchData({ ...filters, page: newPage });
    };

    const onBulkActionClick = (action: ArticleBulkActions) => {
        if (action === "select") {
            setSelectedArticles(apiData.articles.map((a) => a.id));
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

        const oldKeys = filters?.keywordsIds ?? [];
        await fetchData({
            ...filters,
            page: 1,
            keywordsIds: oldKeys.includes(keywordId)
                ? oldKeys.filter((k) => k !== keywordId)
                : [...oldKeys, keywordId],
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

    useDebounceCallback<UserArticlesSearch>(searchQuery, 350, fetchData, {
        ...filters,
        page: 1,
        search: searchQuery,
        keywordsIds: activeKeywordsIds,
    });

    return (
        <PageTitle title={`${title} (${apiData.pagination.total})`} subtitle={subtitle}>
            <div className={cn(rssFetcherMutation.isPending && "opacity-50 pointer-events-none")}>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-baseline lg:justify-between">
                    <InputSearch
                        search={searchQuery}
                        isDisabled={isEditing}
                        onResetClick={onResetClick}
                        onChange={(ev) => setSearchQuery(ev.target.value)}
                    />
                    <OptionsMenu
                        isEditing={isEditing}
                        onEditModeClick={onEditModeClick}
                        showRssFetcher={mode === "active"}
                        onRssFetcherClick={onRssFetcherClick}
                    />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                    <KeywordsBadge
                        isDisabled={isEditing}
                        keywords={apiData.keywords}
                        onKeywordClick={onKeywordClick}
                        activeKeywordsIds={activeKeywordsIds}
                    />
                </div>
                {isEditing &&
                    <EditionButtons
                        selected={selectedArticles}
                        actions={config.bulkActions}
                        isPending={isBulkActionPending}
                        onBulkActionClick={onBulkActionClick}
                        totalVisible={apiData.articles.length}
                    />
                }
                <div className="mb-6 -mt-2">
                    <Pagination
                        isDisabled={isEditing}
                        onChangePage={onPageChange}
                        totalPages={apiData.pagination.pages}
                        currentPage={filters?.page ?? DEFAULT.page}
                    />
                </div>
                {apiData.articles.length === 0 ?
                    <div className="mt-10 rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                        {config.empty}
                    </div>
                    :
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                        {apiData.articles.map((article) =>
                            <ArticleCard
                                key={article.id}
                                article={article}
                                isEditing={isEditing}
                                selected={selectedArticles}
                                archiveIcon={config.archiveIcon}
                                archiveTitle={config.archiveTitle}
                                onSelectionClick={onSelectionClick}
                                showDeleteAction={config.showDeleteAction}
                                onDeleteClick={(articleIds) => onDeleteClick(articleIds, true)}
                                onArchiveClick={(articleIds) => {
                                    if (mode === "deleted") onDeleteClick(articleIds, false);
                                    else onArchiveClick(articleIds, mode === "active");
                                }}
                            />
                        )}
                    </div>
                }
                <div className="mt-3">
                    <Pagination
                        isDisabled={isEditing}
                        onChangePage={onPageChange}
                        totalPages={apiData.pagination.pages}
                        currentPage={filters?.page ?? DEFAULT.page}
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
