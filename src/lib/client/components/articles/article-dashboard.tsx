import {cn} from "@/lib/utils/classnames";
import {useEffect, useState} from "react";
import {Toggle} from "@base-ui/react/toggle";
import {Columns2, Square} from "lucide-react";
import {useSuspenseQuery} from "@tanstack/react-query";
import {ToggleGroup} from "@base-ui/react/toggle-group";
import {Pagination} from "@/lib/client/components/pagination";
import {PageHeader} from "@/lib/client/components/page-header";
import {useRssFetcher} from "@/lib/client/react-query/mutations";
import {buttonVariants} from "@/lib/client/components/ui/button";
import type {userArticleListOptions} from "@/lib/client/react-query";
import {OptionsMenu} from "@/lib/client/components/articles/options-menu";
import {InputSearch} from "@/lib/client/components/articles/input-search";
import {ArticleCard} from "@/lib/client/components/articles/article-card";
import {KeywordsBadge} from "@/lib/client/components/articles/keywords-badge";
import {EditionButtons} from "@/lib/client/components/articles/edition-buttons";
import type {UserArticlesSearch, UserArticleStatus} from "@/lib/schemas/schemas";
import {useArticleBulkActions} from "@/lib/client/hooks/use-article-bulk-actions";
import {RssRefreshStatus} from "@/lib/client/components/articles/rss-refresh-status";
import {type UpdateArticleSearch, useArticleFilters} from "@/lib/client/hooks/use-article-filters";


interface ArticleDashboardProps {
    title: string;
    subtitle: string;
    mode: UserArticleStatus;
    filters: UserArticlesSearch;
    onSearchChange: UpdateArticleSearch;
    articleQueryOptions: ReturnType<typeof userArticleListOptions>;
}


const ARTICLE_COLUMNS_STORAGE_KEY = "sciencefeed.article-columns";
const columnToggleClassName = buttonVariants({
    size: "icon-xs",
    variant: "ghost",
    className: "data-pressed:bg-accent data-pressed:text-accent-foreground",
});


export function ArticleDashboard({ mode, title, subtitle, filters, articleQueryOptions, onSearchChange }: ArticleDashboardProps) {
    const config = modeConfig[mode];
    const rssFetcherMutation = useRssFetcher();
    const [columns, setColumns] = useState<"1" | "2">("2");
    const { articles, keywords, pagination } = useSuspenseQuery(articleQueryOptions).data;
    const { searchQuery, setSearchQuery, activeKeywordIds, clearSearch, toggleKeyword } = useArticleFilters(filters, onSearchChange);

    const {
        isEditing, selectedArticles, isBulkActionPending, clearSelection, onEditModeClick,
        onSelectionClick, onBulkActionClick, onCardArchiveClick, onDeleteClick,
    } = useArticleBulkActions(mode, articles);

    useEffect(() => {
        if (localStorage.getItem(ARTICLE_COLUMNS_STORAGE_KEY) === "1") {
            setColumns("1");
        }
    }, []);

    const onPageChange = async (newPage: number) => {
        clearSelection();
        await onSearchChange((current) => ({ ...current, page: newPage }));
    };

    const onRssFetcherClick = () => {
        rssFetcherMutation.mutate(undefined);
    };

    const paginationProps = {
        isDisabled: isEditing,
        onChangePage: onPageChange,
        totalPages: pagination.pages,
        currentPage: filters.page ?? 1,
    };

    return (
        <PageHeader title={title} count={pagination.total} subtitle={subtitle}>
            <div>
                <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <InputSearch
                        search={searchQuery}
                        isDisabled={isEditing}
                        onResetClick={clearSearch}
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

                <RssRefreshStatus
                    progress={rssFetcherMutation.isPending
                        ? rssFetcherMutation.progress
                        : null
                    }
                />

                <div className="mt-3 grid items-center gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div className="flex min-w-0 flex-wrap gap-2">
                        <KeywordsBadge
                            keywords={keywords}
                            isDisabled={isEditing}
                            onKeywordClick={toggleKeyword}
                            activeKeywordsIds={activeKeywordIds}
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
                                onDeleteClick={onDeleteClick}
                                archiveIcon={config.archiveIcon}
                                archiveTitle={config.archiveTitle}
                                onSelectionClick={onSelectionClick}
                                onArchiveClick={onCardArchiveClick}
                                showDeleteAction={config.showDeleteAction}
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
        </PageHeader>
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
