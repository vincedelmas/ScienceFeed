import {describe, expect, test} from "bun:test";
import {
    fetchSafeRssResponse,
    isPublicIpAddress,
    parseAllowedFeedUrl,
    requestPinnedUrl,
    resolvePublicAddress,
    RssFetchError,
} from "./rss-parser";


describe("RSS URL security", () => {
    test.each([
        "0.0.0.0",
        "10.0.0.1",
        "100.64.0.1",
        "127.0.0.1",
        "169.254.169.254",
        "172.16.0.1",
        "192.168.1.1",
        "198.18.0.1",
        "224.0.0.1",
        "::",
        "::1",
        "::ffff:127.0.0.1",
        "64:ff9b::1",
        "2001:db8::1",
        "fc00::1",
        "fe80::1",
        "ff02::1",
        "4000::1",
    ])("rejects non-public address %s", (address) => {
        expect(isPublicIpAddress(address)).toBe(false);
    });

    test.each([
        "1.1.1.1",
        "8.8.8.8",
        "93.184.216.34",
        "2001:4860:4860::8888",
        "2606:4700:4700::1111",
    ])("accepts public address %s", (address) => {
        expect(isPublicIpAddress(address)).toBe(true);
    });

    test.each([
        "file:///etc/passwd",
        "ftp://example.com/feed.xml",
        "http://user:password@example.com/feed.xml",
    ])("rejects unsafe URL syntax %s", (url) => {
        expect(() => parseAllowedFeedUrl(url)).toThrow(RssFetchError);
    });

    test.each([
        "http://localhost/feed.xml",
        "http://news.localhost/feed.xml",
        "http://2130706433/feed.xml",
        "http://0x7f000001/feed.xml",
        "http://[::ffff:127.0.0.1]/feed.xml",
    ])("rejects a URL resolving to a non-public address: %s", async (url) => {
        await expect(resolvePublicAddress(
            new URL(url).hostname,
            async () => [{ address: "127.0.0.1", family: 4 }],
        )).rejects.toThrow("non-public IP address");
    });

    test("rejects a hostname when any resolved address is non-public", async () => {
        await expect(resolvePublicAddress(
            "example.com",
            async () => [
                { address: "93.184.216.34", family: 4 },
                { address: "127.0.0.1", family: 4 },
            ],
        )).rejects.toThrow("public IP address");
    });

    test("revalidates redirect targets before following them", async () => {
        let requestCount = 0;

        await expect(fetchSafeRssResponse("https://example.com/feed.xml", {
            resolver: (hostname) => resolvePublicAddress(
                hostname,
                async () => [{ address: "93.184.216.34", family: 4 }],
            ),
            requester: async () => {
                requestCount++;
                return {
                    body: "",
                    status: 302,
                    headers: new Headers({ location: "http://127.0.0.1/private" }),
                };
            },
        })).rejects.toThrow("public IP address");

        expect(requestCount).toBe(1);
    });

    test("rejects oversized responses before buffering their body", async () => {
        const server = Bun.serve({
            hostname: "127.0.0.1",
            port: 0,
            fetch: () => new Response(new Uint8Array((5 * 1024 * 1024) + 1), {
                headers: {
                    "Content-Type": "application/rss+xml",
                },
            }),
        });

        try {
            await expect(requestPinnedUrl(
                new URL(`http://rss-test.invalid:${server.port}/feed.xml`),
                { address: "127.0.0.1", family: 4 },
                new AbortController().signal,
            )).rejects.toThrow("exceeds");
        }
        finally {
            await server.stop(true);
        }
    });
});
