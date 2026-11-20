export function parseFeedPublicationDetails(summary: string) {
    const details = summary.match(/^Publication date:\s*(.+?)\s*Source:\s*.+?\s*Authors?(?:\(s\))?:\s*(.+)$/i);
    if (!details) return null;

    const [, publicationDate, authors] = details;
    return { publicationDate, authors };
}
