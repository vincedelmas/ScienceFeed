import {describe, expect, test} from "bun:test";
import {articleTextFromMarkup} from "./article-text";
import {
    fetchSafeRssResponse,
    findMatchingKeywordIds,
    isPublicIpAddress,
    parseAllowedFeedUrl,
    parseRssXml,
    requestPinnedUrl,
    resolvePublicAddress,
    RssFetchError,
} from "./rss-parser";


describe("RSS and Atom parsing", () => {
    test("extracts the alternate article link from an Atom entry", () => {
        const xml = `
            <feed xmlns="http://www.w3.org/2005/Atom">
                <entry>
                    <title>Atom article</title>
                    <link rel="self" href="https://example.com/atom/1"/>
                    <link rel="alternate" href="https://example.com/articles/1"/>
                    <summary>Article summary</summary>
                    <author><name>Jane Doe</name></author>
                    <author><name>John Smith</name></author>
                </entry>
            </feed>
        `;

        expect(parseRssXml(xml)).toEqual([{
            title: "Atom article",
            doi: null,
            description: "Article summary",
            authors: "Jane Doe, John Smith",
            link: "https://example.com/articles/1",
        }]);
    });

    test("extracts articles from Nature RSS 1.0 RDF feeds", () => {
        const xml = `
            <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
                <channel rdf:about="https://www.nature.com/nphys.rss">
                    <title>Nature Physics</title>
                </channel>
                <item rdf:about="https://www.nature.com/articles/example">
                    <title>Physics article</title>
                    <link>https://www.nature.com/articles/example</link>
                    <description>Article summary</description>
                    <dc:creator>Jane Doe</dc:creator>
                    <dc:creator>John Smith</dc:creator>
                </item>
            </rdf:RDF>
        `;

        expect(parseRssXml(xml)).toEqual([{
            title: "Physics article",
            doi: null,
            link: "https://www.nature.com/articles/example",
            description: "Article summary",
            authors: "Jane Doe, John Smith",
        }]);
    });

    test("extracts text links and author names from RSS items", () => {
        const xml = `
            <rss version="2.0">
                <channel>
                    <item>
                        <title>RSS article</title>
                        <link>https://example.com/articles/2</link>
                        <description>Article summary</description>
                        <author>jane@example.com (Jane Doe)</author>
                        <author>editor@example.com</author>
                    </item>
                    <item>
                        <title>Article without authors</title>
                        <link>https://example.com/articles/3</link>
                    </item>
                </channel>
            </rss>
        `;

        const [withAuthor, withoutAuthor] = parseRssXml(xml);
        expect(withAuthor?.link).toBe("https://example.com/articles/2");
        expect(withAuthor?.authors).toBe("Jane Doe");
        expect(withoutAuthor?.authors).toBeNull();
    });

    test("extracts DOIs from feed metadata and links across publishers", () => {
        const xml = `
            <rss xmlns:prism="http://prismstandard.org/namespaces/basic/2.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
                <channel>
                    <item><link>https://example.com/article/1</link><prism:doi>10.1234/ARTICLE</prism:doi></item>
                    <item><link>https://example.com/article/2</link><dc:identifier>doi:10.1234/OTHER</dc:identifier></item>
                    <item><link>https://doi.org/10.1234%2FEXAMPLE?tracking=1</link></item>
                    <item><link>http://pubs.rsc.org/en/Content/ArticleLanding/2026/SC/D6SC00001J</link></item>
                    <item><link>https://pubs.rsc.org/sc/article/doi/10.1039/d6sc00002d/12345/Article-title</link></item>
                    <item><link>https://pubs.acs.org/accacs/article/doi/10.1021/acscatal.6c07504/5472972/Article-title</link></item>
                    <item><link>https://www.nature.com/articles/d41586-026-03680-1</link></item>
                    <item><link>https://www.nature.com/articles/s41599-026-07431-5</link></item>
                    <item><link>https://www.sciencedirect.com/science/article/pii/S0009261426000000</link></item>
                </channel>
            </rss>
        `;

        expect(parseRssXml(xml).map(({ doi }) => doi)).toEqual([
            "10.1234/article", "10.1234/other", "10.1234/example", "10.1039/d6sc00001j", "10.1039/d6sc00002d",
            "10.1021/acscatal.6c07504", "10.1038/d41586-026-03680-1", null, null,
        ]);
    });

    test("keeps authors provided in a feed's publication summary", () => {
        const xml = `
            <rss><channel><item>
                <title>Article</title>
                <description><![CDATA[<p>Publication date: 1 March 2027</p><p>Source: Journal</p><p>Author(s): Jane Doe, John Smith</p>]]></description>
            </item></channel></rss>
        `;

        expect(parseRssXml(xml)[0]?.authors).toBe("Jane Doe, John Smith");
    });
});


describe("feed summary formatting", () => {
    test("separates headings and paragraphs while preserving inline text", () => {
        const html = '<img alt="Illustration"/><span class="paragraphSection"><div class="boxTitle">Conspectus</div>Atherosclerosis is a chronic disease.<p>We examine redox-active Fe<sup>2+</sup> probes.</p></span>';

        expect(articleTextFromMarkup(html)).toBe("Conspectus Atherosclerosis is a chronic disease. We examine redox-active Fe2+ probes.");
    });

    test("turns Crossref JATS paragraphs and entities into plain text", () => {
        const abstract = "<jats:p>We examine Fe<jats:sup>2+</jats:sup> &amp; Cu.</jats:p><jats:p>Results show &#x2265; 80% conversion.</jats:p>";

        expect(articleTextFromMarkup(abstract)).toBe("We examine Fe2+ & Cu. Results show ≥ 80% conversion.");
    });
});


describe("keyword matching", () => {
    const rssItem = {
        title: "AI transforms materials science",
        description: "This AI model predicts new compounds.",
        link: "https://nature.example/articles/123",
    };

    test("returns the original ID for a mixed-case keyword", () => {
        expect(findMatchingKeywordIds([
            { id: 42, name: "Science" },
        ], rssItem)).toEqual([42]);
    });

    test("matches overlapping keywords independently", () => {
        expect(findMatchingKeywordIds([
            { id: 1, name: "AI" },
            { id: 2, name: "AI model" },
        ], rssItem)).toEqual([1, 2]);
    });

    test("does not match a keyword found only in the article URL", () => {
        expect(findMatchingKeywordIds([
            { id: 1, name: "nature" },
        ], rssItem)).toEqual([]);
    });
});


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
