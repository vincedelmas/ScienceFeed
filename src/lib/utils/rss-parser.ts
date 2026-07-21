import {Buffer} from "node:buffer";
import {lookup} from "node:dns/promises";
import {XMLParser} from "fast-xml-parser";
import {request as httpRequest} from "node:http";
import {request as httpsRequest} from "node:https";
import {BlockList, isIP, type LookupFunction} from "node:net";


const RSS_MAX_REDIRECTS = 5;
const RSS_FETCH_TIMEOUT_MS = 30_000;
const RSS_MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const CLOUDFLARE_CHALLENGE_HEADER = "challenge";
const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);
const FEEDPARSER_USER_AGENT = "feedparser/6.0.12 +https://github.com/kurtmckee/feedparser/";


type HostLookup = (hostname: string) => Promise<ResolvedAddress[]>;
type AddressResolver = (hostname: string) => Promise<ResolvedAddress>;


type ResolvedAddress = {
    family: number;
    address: string;
};


type RssHttpResponse = {
    body: string;
    status: number;
    headers: Headers;
};


type SafeRssRequestOptions = {
    resolver?: AddressResolver;
    requester?: typeof requestPinnedUrl;
};


export type RssItem = {
    link: string | null;
    title: string | null;
    description: string | null;
};


export class RssFetchError extends Error {
    constructor(message: string, readonly status?: number, readonly isCloudflareChallenge = false) {
        super(message);
        this.name = "RssFetchError";
    }
}


const blockedIpAddresses = new BlockList();
const globalIpv6Addresses = new BlockList();

const blockedIpv4Ranges = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10],
    ["127.0.0.0", 8],
    ["169.254.0.0", 16],
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.0.2.0", 24],
    ["192.88.99.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["198.51.100.0", 24],
    ["203.0.113.0", 24],
    ["224.0.0.0", 4],
    ["240.0.0.0", 4],
] as const;

const blockedIpv6Ranges = [
    ["2001::", 23],
    ["2001:db8::", 32],
    ["2002::", 16],
    ["3fff::", 20],
] as const;

globalIpv6Addresses.addSubnet("2000::", 3, "ipv6");
blockedIpv4Ranges.forEach(([address, prefix]) => blockedIpAddresses.addSubnet(address, prefix, "ipv4"));
blockedIpv6Ranges.forEach(([address, prefix]) => blockedIpAddresses.addSubnet(address, prefix, "ipv6"));


export const isPublicIpAddress = (address: string) => {
    const family = isIP(address);
    if (family === 4) return !blockedIpAddresses.check(address, "ipv4");
    if (family === 6) return globalIpv6Addresses.check(address, "ipv6") && !blockedIpAddresses.check(address, "ipv6");

    return false;
};


export const parseAllowedFeedUrl = (value: string | URL, base?: URL) => {
    let url: URL;

    try {
        url = new URL(value, base);
    }
    catch {
        throw new RssFetchError("RSS feed URL is invalid");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new RssFetchError("RSS feed URL must use HTTP or HTTPS");
    }

    if (url.username || url.password) {
        throw new RssFetchError("RSS feed URL must not contain credentials");
    }

    return url;
};


const systemLookup: HostLookup = (hostname) => {
    return lookup(hostname, { all: true, order: "ipv4first" });
}


const abortable = <T>(promise: Promise<T>, signal: AbortSignal) => {
    return new Promise<T>((resolve, reject) => {
        const onAbort = () => reject(new DOMException("The operation was aborted", "AbortError"));

        if (signal.aborted) {
            onAbort();
            return;
        }

        signal.addEventListener("abort", onAbort, { once: true });

        promise.then((value) => {
            signal.removeEventListener("abort", onAbort);
            resolve(value);
        }, (error) => {
            signal.removeEventListener("abort", onAbort);
            reject(error);
        });
    });
};


export const resolvePublicAddress = async (hostname: string, hostLookup: HostLookup = systemLookup) => {
    const checkedHostname = hostname.replace(/^\[|]$/g, "").replace(/\.$/, "");
    const literalFamily = isIP(checkedHostname);

    const addresses = literalFamily
        ? [{ address: checkedHostname, family: literalFamily }]
        : await hostLookup(checkedHostname);

    if (addresses.length === 0) {
        throw new RssFetchError("RSS feed hostname did not resolve to an IP address");
    }

    if (addresses.some(({ address }) => !isPublicIpAddress(address))) {
        throw new RssFetchError("RSS feed hostname resolves to a non-public IP address");
    }

    return addresses[0];
};


const createPinnedLookup = ({ address, family }: ResolvedAddress): LookupFunction => {
    return (_hostname, options, callback) => {
        if (options.all) {
            callback(null, [{ address, family }]);
            return;
        }

        callback(null, address, family);
    };
};


const headersFromResponse = (headers: Record<string, string | string[] | undefined>) => {
    const result = new Headers();

    for (const [name, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
            value.forEach((item) => result.append(name, item));
        }
        else if (value !== undefined) {
            result.set(name, value);
        }
    }

    return result;
};


export const requestPinnedUrl = (url: URL, resolvedAddress: ResolvedAddress, signal: AbortSignal): Promise<RssHttpResponse> => {
    return new Promise((res, reject) => {
        const request = url.protocol === "https:" ? httpsRequest : httpRequest;

        const options = {
            signal,
            agent: false,
            lookup: createPinnedLookup(resolvedAddress),
            headers: {
                "User-Agent": FEEDPARSER_USER_AGENT,
                "Accept": "application/atom+xml,application/rdf+xml,application/rss+xml,application/xml;q=0.9,text/xml;q=0.8,text/plain;q=0.2,*/*;q=0.1",
            }
        };

        const req = request(url, options, (response) => {
            const status = response.statusCode ?? 0;
            const headers = headersFromResponse(response.headers);

            if (REDIRECT_STATUS_CODES.has(status) || status < 200 || status >= 300) {
                response.destroy();
                res({ body: "", headers, status });
                return;
            }

            const contentLength = Number(headers.get("content-length"));
            if (Number.isFinite(contentLength) && contentLength > RSS_MAX_RESPONSE_BYTES) {
                response.destroy();
                reject(new RssFetchError(`RSS feed response exceeds ${RSS_MAX_RESPONSE_BYTES} bytes`));
                return;
            }

            let totalBytes = 0;
            const chunks: Buffer[] = [];

            response.on("data", (chunk: Buffer) => {
                totalBytes += chunk.byteLength;

                if (totalBytes > RSS_MAX_RESPONSE_BYTES) {
                    response.destroy(new RssFetchError(`RSS feed response exceeds ${RSS_MAX_RESPONSE_BYTES} bytes`));
                    return;
                }

                chunks.push(chunk);
            });

            response.on("error", reject);
            response.on("aborted", () => reject(new RssFetchError("RSS feed response was interrupted")));
            response.on("end", () => res({ headers, status, body: Buffer.concat(chunks).toString("utf8") }));
        });

        req.on("error", reject);
        req.end();
    });
};


export const fetchSafeRssResponse = async (value: string | URL, options: SafeRssRequestOptions = {}) => {
    const requester = options.requester ?? requestPinnedUrl;
    const resolver = options.resolver ?? resolvePublicAddress;

    const controller = new AbortController();

    let currentUrl = parseAllowedFeedUrl(value);
    const timeout = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);

    try {
        for (let redirectCount = 0; redirectCount <= RSS_MAX_REDIRECTS; redirectCount++) {
            const address = await abortable(resolver(currentUrl.hostname), controller.signal);
            const response = await requester(currentUrl, address, controller.signal);

            if (!REDIRECT_STATUS_CODES.has(response.status)) {
                return response;
            }

            const location = response.headers.get("location");
            if (!location) {
                throw new RssFetchError(`RSS feed redirect from ${currentUrl.href} has no Location header`, response.status);
            }

            if (redirectCount === RSS_MAX_REDIRECTS) {
                throw new RssFetchError(`RSS feed exceeded ${RSS_MAX_REDIRECTS} redirects`);
            }

            currentUrl = parseAllowedFeedUrl(location, currentUrl);
        }
    }
    catch (error) {
        if (controller.signal.aborted) {
            throw new RssFetchError(`RSS feed request timed out after ${RSS_FETCH_TIMEOUT_MS}ms`);
        }
        throw error;
    }
    finally {
        clearTimeout(timeout);
    }

    throw new RssFetchError("RSS feed request failed");
};


export async function parseRssFeed(url: string): Promise<RssItem[]> {
    const res = await fetchSafeRssResponse(url);

    const isCloudflareChallenge =
        res.headers.get("cf-mitigated") === CLOUDFLARE_CHALLENGE_HEADER ||
        res.headers.get("server")?.toLowerCase() === "cloudflare" && res.status === 403;

    if (isCloudflareChallenge) {
        throw new RssFetchError(`Failed to fetch RSS feed ${url}. Cloudflare challenge`, res.status, true);
    }

    if (res.status < 200 || res.status >= 300) {
        throw new RssFetchError(`Failed to fetch RSS feed ${url}. HTTP ${res.status}`, res.status);
    }

    const parser = new XMLParser({
        trimValues: true,
        processEntities: true,
        ignoreAttributes: true,
        attributeNamePrefix: "",
        cdataPropName: "__cdata",
    });

    const xml = res.body;
    if (/<title>\s*Just a moment\.\.\.\s*<\/title>/i.test(xml)) {
        throw new RssFetchError(`Failed to fetch RSS feed ${url}. Cloudflare challenge`, res.status, true);
    }

    if (!xml.replace(/^\uFEFF/, "").trimStart().startsWith("<")) {
        throw new RssFetchError(`Failed to fetch RSS feed ${url}. Response is not XML`, res.status);
    }

    const doc = parser.parse(xml);

    let items: unknown = doc?.rss?.channel?.item ?? doc?.rdf?.item ?? doc?.channel?.item;
    if (!items && doc?.feed?.entry) items = doc.feed.entry;
    if (!items) return [];

    const arr = Array.isArray(items) ? items : [items];

    const toStringOrNull = (v: unknown) => {
        if (v == null) return null;
        if (typeof v === "string") return v;

        if (typeof v === "object") {
            const maybeCdata = (v as any).__cdata;
            if (typeof maybeCdata === "string") return maybeCdata;

            const maybeText = (v as any)["#text"];
            if (typeof maybeText === "string") return maybeText;
        }

        return String(v);
    };

    const extractLink = (item: any): string | null => {
        if (item.link != null) {
            const linkVal = item.link;
            if (typeof linkVal === "string") return linkVal;

            if (Array.isArray(linkVal)) {
                const first = linkVal[0];
                if (typeof first === "string") return first;
                if (first && typeof first.href === "string") return first.href;
            }
            else if (linkVal && typeof linkVal.href === "string") {
                return linkVal.href;
            }

            const asText = toStringOrNull(linkVal);
            if (asText) return asText;
        }

        if (item.link == null && item.href) return String(item.href);

        const links = item.link;
        if (Array.isArray(links)) {
            const alt = links.find((l: any) => typeof l === "object" && l.rel === "alternate" && l.href);
            if (alt?.href) return String(alt.href);

            const firstHref = links.find((l: any) => typeof l === "object" && l.href);
            if (firstHref?.href) return String(firstHref.href);

            const firstString = links.find((l: any) => typeof l === "string");
            if (firstString) return String(firstString);
        }

        return null;
    };

    const extractDescription = (item: any): string | null => {
        if (item.description != null) {
            const d = toStringOrNull(item.description);
            if (d) return d;
        }

        const contentEncoded = item["content:encoded"] ?? item["contentEncoded"] ?? null;
        if (contentEncoded != null) {
            const c = toStringOrNull(contentEncoded);
            if (c) return c;
        }

        if (item.summary != null) {
            const s = toStringOrNull(item.summary);
            if (s) return s;
        }

        if (item.content != null) {
            const c = toStringOrNull(item.content);
            if (c) return c;
        }

        return null;
    };

    const result: RssItem[] = arr.map((item: any) => {
        const title = toStringOrNull(item.title) ?? null;

        const link = extractLink(item);
        const description = extractDescription(item);

        return { title, link, description };
    });

    return result;
}


export function findMatchingKeywordIds(keywords: { id: number; name: string }[], rssItem: RssItem) {
    const content = `${rssItem.title ?? ""}\n${rssItem.description ?? ""}`.toLowerCase();

    return keywords
        .filter((keyword) => content.includes(keyword.name.toLowerCase()))
        .map((keyword) => keyword.id);
}


export function cleanHtmlWithRegex(html: string): string {
    const noScriptStyle = html.replace(/<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, "");
    const noTags = noScriptStyle.replace(/<[^>]*?>/g, "");
    const cleanText = noTags.replace(/\s+/g, " ").trim();

    return cleanText;
}
