import {useLayoutEffect, useRef, useState} from "react";


export function ArticleSummary({ summary }: { summary: string }) {
    const areaRef = useRef<HTMLDivElement>(null);
    const [lineCount, setLineCount] = useState(1);
    const textRef = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        const area = areaRef.current;
        const text = textRef.current;

        if (!area || !text) return;

        const updateLineCount = (height: number) => {
            const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
            setLineCount(Math.max(1, Math.floor(height / lineHeight)));
        };

        updateLineCount(area.getBoundingClientRect().height);
        const observer = new ResizeObserver(([entry]) => updateLineCount(entry.contentRect.height));

        observer.observe(area);

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={areaRef} className="my-4 min-h-0 flex-1 overflow-hidden">
            <p
                ref={textRef}
                style={{ WebkitLineClamp: lineCount }}
                className="line-clamp-1 text-sm leading-5 text-foreground-muted"
            >
                {summary}
            </p>
        </div>
    );
}
