import {useEffect, useRef, useState} from "react";
import {useLocation, useRouter} from "@tanstack/react-router";
import type {UserArticlesSearch} from "@/lib/schemas/schemas";


export type UpdateArticleSearch = (update: (current: UserArticlesSearch) => UserArticlesSearch) => Promise<void>;


export function useArticleFilters(filters: UserArticlesSearch, onSearchChange: UpdateArticleSearch) {
    const router = useRouter();
    const location = useLocation({ structuralSharing: false });
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [draft, setDraft] = useState<{ location: typeof location; query: string }>();

    const appliedQuery = filters.search ?? "";
    const draftQuery = draft?.location === location ? draft.query : undefined;

    useEffect(() => () => clearTimeout(timer.current), [location]);

    const setSearchQuery = (query: string) => {
        setDraft({ location, query });
        clearTimeout(timer.current);
        if (query === appliedQuery) return;

        timer.current = setTimeout(() => {
            // History may have moved while next route's loader is pending
            if (router.history.location.state.__TSR_key !== location.state.__TSR_key) return;
            void onSearchChange((current) => ({ ...current, search: query, page: 1 }));
        }, 350);
    };

    const clearSearch = () => {
        clearTimeout(timer.current);
        setDraft({ location, query: "" });
        return onSearchChange((current) => ({ ...current, search: "", page: 1 }));
    };

    const toggleKeyword = (keywordId: number) => {
        clearTimeout(timer.current);
        return onSearchChange((current) => {
            const keywordIds = current.keywordsIds ?? [];
            return {
                ...current,
                page: 1,
                search: draftQuery ?? current.search,
                keywordsIds: keywordIds.includes(keywordId)
                    ? keywordIds.filter((id) => id !== keywordId)
                    : [...keywordIds, keywordId],
            };
        });
    };

    return {
        clearSearch,
        toggleKeyword,
        setSearchQuery,
        searchQuery: draftQuery ?? appliedQuery,
        activeKeywordIds: filters.keywordsIds ?? [],
    };
}
