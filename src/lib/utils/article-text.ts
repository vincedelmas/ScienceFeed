import {decodeHTMLStrict} from "entities";


export function articleTextFromMarkup(markup: string): string {
    const text = markup
        .replace(/<(script|style)[\s\S]*?>[\s\S]*?<\/\1>/gi, "")
        .replace(/<\/?(?:jats:)?(?:blockquote|br|div|h[1-6]|hr|li|list-item|p|sec|section|td|th|title|tr)(?=[\s/>])[^>]*>/gi, " ")
        .replace(/<[^>]*?>/g, "");

    return decodeHTMLStrict(text).replace(/\s+/g, " ").trim();
}
