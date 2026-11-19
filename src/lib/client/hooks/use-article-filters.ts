import {useState} from "react";
import type {UserArticlesSearch} from "@/lib/schemas/schemas";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";


export function useArticleFilters(filters: UserArticlesSearch, onSearchChange: (params: UserArticlesSearch) => Promise<void>) {
    const [searchQuery, setSearchQuery] = useState(filters.search ?? "");
    const [activeKeywordIds, setActiveKeywordIds] = useState(filters.keywordsIds ?? []);

    const clearSearch = async () => {
        setSearchQuery("");
        await onSearchChange({ search: "", page: 1, keywordsIds: activeKeywordIds });
    };

    const toggleKeyword = async (keywordId: number) => {
        const toggleId = (ids: number[]) => ids.includes(keywordId)
            ? ids.filter((id) => id !== keywordId)
            : [...ids, keywordId];

        setActiveKeywordIds(toggleId);
        await onSearchChange({ ...filters, page: 1, keywordsIds: toggleId(filters.keywordsIds ?? []) });
    };

    useDebounceCallback<UserArticlesSearch>(searchQuery, 350, onSearchChange, {
        ...filters,
        page: 1,
        search: searchQuery,
        keywordsIds: activeKeywordIds,
    });

    return {
        searchQuery,
        clearSearch,
        toggleKeyword,
        setSearchQuery,
        activeKeywordIds,
    };
}
