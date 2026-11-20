import pLimit from "p-limit";
import {serverEnv} from "@/env/server";
import {articleTextFromMarkup} from "@/lib/utils/article-text";


type CrossrefResponse = {
    message: {
        abstract?: string;
        author?: {
            name?: string;
            given?: string;
            family?: string;
        }[];
    };
};


// Match the public pool's concurrency limit across refreshes.
const crossrefLimit = pLimit(1);
const requestIntervalMs = serverEnv.CROSSREF_MAILTO ? 100 : 200;
const requestTimeoutMs = 5_000;
const cooldownMs = 60_000;
let pausedUntil = 0;
let nextRequestAt = 0;


export function fetchCrossrefMetadata(doi: string) {
    return crossrefLimit(async () => {
        if (Date.now() < pausedUntil) return null;

        const delay = nextRequestAt - Date.now();
        if (delay > 0) {
            await Bun.sleep(delay);
        }

        const url = new URL(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (serverEnv.CROSSREF_MAILTO) {
            url.searchParams.set("mailto", serverEnv.CROSSREF_MAILTO);
        }

        try {
            nextRequestAt = Date.now() + requestIntervalMs;
            const response = await fetch(url, { signal: AbortSignal.timeout(requestTimeoutMs) });

            if (!response.ok) {
                if (response.status === 429 || response.status === 403 || response.status >= 500) {
                    const retryAfter = response.headers.get("retry-after");
                    const retryAt = retryAfter && /^\d+$/.test(retryAfter)
                        ? Date.now() + Number(retryAfter) * 1000
                        : Date.parse(retryAfter ?? "");

                    pausedUntil = Math.max(Date.now() + cooldownMs, retryAt || 0);
                }
                await response.body?.cancel();
                return null;
            }

            const { message } = await response.json() as CrossrefResponse;

            const authors = message.author
                ?.map(({ given, family, name }) => name || [given, family].filter(Boolean).join(" "))
                .filter(Boolean)
                .join(", ");

            return {
                authors: authors || undefined,
                summary: articleTextFromMarkup(message.abstract ?? "") || undefined,
            };
        }
        catch {
            pausedUntil = Math.max(pausedUntil, Date.now() + cooldownMs);
            return null;
        }
    });
}
