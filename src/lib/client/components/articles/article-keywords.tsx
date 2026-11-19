import {Badge} from "@/lib/client/components/ui/badge";
import {useLayoutEffect, useRef, useState} from "react";
import {Popover, PopoverContent, PopoverTitle, PopoverTrigger} from "@/lib/client/components/ui/popover";


export function ArticleKeywords({ keywords, isEditing }: { keywords: string[]; isEditing: boolean }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(0);
    const keywordMeasurementsRef = useRef<HTMLDivElement>(null);
    const overflowMeasurementsRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const row = rowRef.current;
        const keywordMeasurements = keywordMeasurementsRef.current;
        const overflowMeasurements = overflowMeasurementsRef.current;

        if (!row || !keywordMeasurements || !overflowMeasurements) {
            return;
        }

        const update = () => {
            const availableWidth = row.getBoundingClientRect().width;
            const keywordRow = keywordMeasurements.getBoundingClientRect();

            if (keywordRow.width <= availableWidth) {
                setVisibleCount(keywords.length);
                return;
            }

            const gap = parseFloat(getComputedStyle(keywordMeasurements).columnGap);

            // Leave room for the '+N' badge when choosing how many keywords to show
            for (let count = keywords.length - 1; count > 0; count--) {
                const lastKeyword = keywordMeasurements.children[count - 1].getBoundingClientRect();
                const overflowBadge = overflowMeasurements.children[count].getBoundingClientRect();
                const requiredWidth = lastKeyword.right - keywordRow.left + gap + overflowBadge.width;

                if (requiredWidth <= availableWidth) {
                    setVisibleCount(count);
                    return;
                }
            }

            setVisibleCount(0);
        };

        update();
        const observer = new ResizeObserver(update);

        observer.observe(row);
        observer.observe(keywordMeasurements);
        observer.observe(overflowMeasurements);

        return () => observer.disconnect();
    }, [keywords]);

    const keywordBadges = keywords.map((keyword) =>
        <Badge key={keyword} variant="outline">
            {keyword}
        </Badge>
    );

    const hiddenKeywords = keywords.slice(visibleCount);
    const hiddenCount = hiddenKeywords.length;

    return (
        <div ref={rowRef} className="relative flex min-w-0 flex-1 items-center gap-2">
            <div aria-hidden="true" className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden">
                <div ref={keywordMeasurementsRef} className="flex w-max gap-2">
                    {keywordBadges}
                </div>
                <div ref={overflowMeasurementsRef} className="flex w-max">
                    {keywords.map((keyword, idx) =>
                        <Badge key={keyword} variant="secondary">
                            +{keywords.length - idx}
                        </Badge>
                    )}
                </div>
            </div>
            {keywordBadges.slice(0, visibleCount)}
            {hiddenCount > 0 &&
                <Popover>
                    <Badge
                        variant="secondary"
                        render={
                            <PopoverTrigger
                                disabled={isEditing}
                                className="cursor-pointer hover:bg-accent"
                                aria-label={`Show ${hiddenCount} more article keywords`}
                            />
                        }
                    >
                        +{hiddenCount}
                    </Badge>
                    <PopoverContent side="top" align="start">
                        <PopoverTitle>
                            More keywords
                        </PopoverTitle>
                        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                            {hiddenKeywords.map((keyword) =>
                                <Badge key={keyword} variant="outline" className="h-auto max-w-full wrap-anywhere whitespace-normal">
                                    {keyword}
                                </Badge>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            }
        </div>
    );
}
