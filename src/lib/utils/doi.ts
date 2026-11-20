export function getArticleDoi(value: string | null): string | null {
    if (!value) return null;

    const candidate = value.trim().replace(/^doi:\s*/i, "");
    if (/^10\.\d{4,9}\/\S+$/i.test(candidate)) return candidate.toLowerCase();

    try {
        const url = new URL(candidate);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return null;
        }

        const path = decodeURIComponent(url.pathname);

        // Publisher links can append an internal article ID and slug after DOI
        const articleDoi = path.match(/\/article(?:-abstract|-pdf)?\/doi\/(10\.\d{4,9}\/[^/\s]+)\/\d+(?:\/|$)/i)?.[1];
        if (articleDoi) {
            return articleDoi.toLowerCase();
        }

        if (url.hostname === "pubs.rsc.org") {
            const articleCode = path.match(/\/content\/article(?:landing|html|pdf)\/\d{4}\/[a-z]{2}\/([a-z]\d[a-z]{2}\d{5}[a-z])\/?$/i)?.[1];
            if (articleCode) {
                return `10.1039/${articleCode.toLowerCase()}`;
            }
        }

        if (url.hostname === "www.nature.com" || url.hostname === "nature.com") {
            const articleCode = path.match(/^\/articles\/([ds]41586-\d{3}-\d{5}-[a-z0-9])\/?$/i)?.[1];
            if (articleCode) {
                return `10.1038/${articleCode.toLowerCase()}`;
            }
        }

        return path.match(/\/(10\.\d{4,9}\/\S+)$/i)?.[1]?.toLowerCase() ?? null;
    }
    catch {
        return null;
    }
}
