export type RssRefreshProgress = {
    total: number;
    failed: number;
    journal?: string;
    completed: number;
    phase: "fetching" | "saving";
};


export type RssRefreshEvent =
    | { type: "progress"; progress: RssRefreshProgress }
    | { type: "complete"; processedFeeds: number; failedFeeds: number; warn?: string };
