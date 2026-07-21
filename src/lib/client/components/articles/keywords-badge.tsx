import {cn} from "@/lib/utils/utils";
import {Badge} from "@/lib/client/components/ui/badge";


interface KeywordsBadgeProps {
    isDisabled?: boolean;
    activeKeywordsIds: number[];
    onKeywordClick: (keywordId: number) => void;
    keywords: {
        id: number,
        name: string,
        active: boolean,
    }[];
}


export const KeywordsBadge = ({ isDisabled, keywords, activeKeywordsIds, onKeywordClick }: KeywordsBadgeProps) => {
    return (
        <>
            {keywords.map((keyword) => {
                const isActive = activeKeywordsIds.includes(keyword.id);

                return (
                    <Badge
                        asChild
                        key={keyword.id}
                        variant="outline"
                        className={cn(
                            "cursor-pointer rounded-full border px-2.5 py-1 text-xs transition-colors",
                            isActive
                                ? "border-success-border bg-success-muted text-success-foreground hover:bg-success-muted/80"
                                : "border-border-subtle bg-surface-muted text-foreground-muted hover:bg-surface-hover hover:text-foreground",
                            isDisabled && (isActive
                                ? "cursor-default opacity-60 hover:bg-success-muted hover:text-success-foreground"
                                : "cursor-default opacity-60 hover:bg-surface-muted hover:text-foreground-muted"),
                        )}
                    >
                        <button
                            type="button"
                            disabled={isDisabled}
                            aria-pressed={isActive}
                            onClick={() => onKeywordClick(keyword.id)}
                        >
                            {keyword.name}
                        </button>
                    </Badge>
                );
            })}
        </>
    );
};
