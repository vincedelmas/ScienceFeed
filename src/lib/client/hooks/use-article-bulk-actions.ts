import {useEffect, useState} from "react";
import {toast} from "@/lib/client/components/ui/toast";
import type {UserArticleStatus} from "@/lib/schemas/schemas";
import type {ArticleBulkActions, UserArticle} from "@/lib/types/types";
import {useArchiveArticles, useDeleteArticles} from "@/lib/client/react-query/mutations";


export function useArticleBulkActions(mode: UserArticleStatus, articles: readonly Pick<UserArticle, "id">[]) {
    const deleteMutation = useDeleteArticles();
    const archiveMutation = useArchiveArticles();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedArticles, setSelectedArticles] = useState<number[]>([]);

    const visibleArticleIds = articles.map(({ id }) => id);
    const visibleArticleIdsKey = visibleArticleIds.join(",");

    useEffect(() => {
        const visibleIds = new Set(visibleArticleIdsKey.split(",").filter(Boolean).map(Number));
        setSelectedArticles((prev) => {
            const next = prev.filter((id) => visibleIds.has(id));
            return next.length === prev.length ? prev : next;
        });
    }, [visibleArticleIdsKey]);

    const clearSelection = () => {
        setSelectedArticles([]);
    }

    const onEditModeClick = () => {
        setIsEditing((editing) => !editing);
        clearSelection();
    };

    const onSelectionClick = (articleId: number) => {
        setSelectedArticles((previous) => previous.includes(articleId)
            ? previous.filter((id) => id !== articleId)
            : [...previous, articleId]
        );
    };

    const onArchiveClick = (articleIds: number[], archive: boolean) => {
        clearSelection();
        archiveMutation.mutate({ data: { articleIds, archive } }, {
            onError: () => {
                toast.add({ type: "error", title: `Failed to ${archive ? "archive" : "unarchive"} the article(s)` });
            },
        });
    };

    const onDeleteClick = (articleIds: number[], isDeleted = true) => {
        clearSelection();
        deleteMutation.mutate({ data: { articleIds, isDeleted } }, {
            onError: () => {
                toast.add({ type: "error", title: `Failed to ${isDeleted ? "delete" : "restore"} the article(s)` });
            },
        });
    };

    const onCardArchiveClick = (articleIds: number[]) => {
        if (mode === "deleted") {
            onDeleteClick(articleIds, false);
        }
        else {
            onArchiveClick(articleIds, mode === "active");
        }
    };

    const onBulkActionClick = (action: ArticleBulkActions) => {
        switch (action) {
            case "select":
                setSelectedArticles(visibleArticleIds);
                break;
            case "deselect":
                clearSelection();
                break;
            case "archive":
                onArchiveClick(selectedArticles, true);
                break;
            case "unarchive":
                onArchiveClick(selectedArticles, false);
                break;
            case "delete":
                onDeleteClick(selectedArticles);
                break;
            case "restore":
                onDeleteClick(selectedArticles, false);
                break;
        }
    };

    return {
        isEditing,
        onDeleteClick,
        clearSelection,
        onEditModeClick,
        selectedArticles,
        onSelectionClick,
        onBulkActionClick,
        onCardArchiveClick,
        isBulkActionPending: archiveMutation.isPending || deleteMutation.isPending,
    };
}
