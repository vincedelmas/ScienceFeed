import type {RssRefreshProgress} from "@/lib/types/rss-refresh";
import {Progress, ProgressLabel, ProgressValue} from "@/lib/client/components/ui/progress";


interface RssRefreshStatusProps {
    progress: RssRefreshProgress | null;
}


export function RssRefreshStatus({ progress }: RssRefreshStatusProps) {
    return (
        <div role="status" aria-live="polite" aria-atomic="true">
            {progress &&
                <div className="mt-4 flex flex-col gap-2 rounded-lg border p-3">
                    <Progress value={progress.completed} max={progress.total || 1}>
                        <ProgressLabel>
                            {progress.phase === "saving" ? "Saving matching articles…" : "Checking feeds…"}
                        </ProgressLabel>
                        <ProgressValue>
                            {() => `${progress.completed} / ${progress.total} feeds`}
                        </ProgressValue>
                    </Progress>
                    <p className="text-sm text-muted-foreground">
                        {progress.journal ? `Last checked: ${progress.journal}. ` : ""}
                        {progress.failed > 0 ? `${progress.failed} failed. ` : ""}
                        You can keep browsing.
                    </p>
                </div>
            }
        </div>
    );
}
