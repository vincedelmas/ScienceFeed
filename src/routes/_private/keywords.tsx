import {toast} from "sonner";
import {useState} from "react";
import {cn} from "@/lib/utils/utils";
import {UserKeyword} from "@/lib/types/types";
import {Input} from "@/lib/client/components/ui/input";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {userKeywordsOptions} from "@/lib/client/react-query";
import {PageTitle} from "@/lib/client/components/page-title";
import {Loader2, PauseCircle, PlayCircle, Plus, Tags, Trash2} from "lucide-react";
import {useAddKeywordMutation, useDeleteKeywordMutation, useToggleKeywordMutation} from "@/lib/client/react-query/mutations";


export const Route = createFileRoute("/_private/keywords")({
    component: KeywordManagerPage,
    loader: ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(userKeywordsOptions);
    },
});


function KeywordManagerPage() {
    const addKeywordMutation = useAddKeywordMutation();
    const deleteKeywordMutation = useDeleteKeywordMutation();
    const toggleKeywordMutation = useToggleKeywordMutation();
    const [newKeyword, setNewKeyword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [pendingToggleKeywordId, setPendingToggleKeywordId] = useState<number | null>(null);
    const [pendingDeleteKeywordId, setPendingDeleteKeywordId] = useState<number | null>(null);
    const userKeywords = useSuspenseQuery(userKeywordsOptions).data;
    const sortedKeywords = [...userKeywords].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    const activeCount = userKeywords.filter((keyword) => keyword.active).length;
    const inactiveCount = userKeywords.length - activeCount;
    const totalLinkedArticles = userKeywords.reduce((total, keyword) => total + Number(keyword.totalArticles ?? 0), 0);
    const trimmedKeyword = newKeyword.trim();
    const normalizedKeyword = trimmedKeyword.toLocaleLowerCase();

    const handleAddNewKeyword = () => {
        if (addKeywordMutation.isPending) return;

        if (trimmedKeyword === "") {
            return setErrorMessage("Keyword cannot be empty");
        }

        if (userKeywords.some((k) => k.name.toLocaleLowerCase() === normalizedKeyword)) {
            return setErrorMessage("Keyword name already exists");
        }

        setErrorMessage("");
        addKeywordMutation.mutate({ data: { name: trimmedKeyword } }, {
            onError: (error) => {
                setErrorMessage(error?.message ?? "Failed to add new keyword");
                toast.error("Failed to add new keyword");
            },
            onSuccess: () => {
                setNewKeyword("");
            },
        });
    };

    const handleDeleteKeyword = (keyword: UserKeyword) => {
        if (pendingDeleteKeywordId !== null || pendingToggleKeywordId !== null) return;
        if (!confirm(`Delete "${keyword.name}"? This keyword will be removed from ${formatCount(keyword.totalArticles)} article(s).`)) return;

        setPendingDeleteKeywordId(keyword.id);
        deleteKeywordMutation.mutate({ data: { keywordId: keyword.id } }, {
            onError: () => {
                setPendingDeleteKeywordId(null);
                toast.error("Failed to delete keyword");
            },
            onSuccess: () => {
                setPendingDeleteKeywordId(null);
            },
        });
    };

    const handleToggleKeyword = (keyword: UserKeyword) => {
        if (pendingToggleKeywordId !== null || pendingDeleteKeywordId !== null) return;

        if (keyword.active) {
            if (!confirm(`By deactivating this keyword, the associated articles will not be shown in your dashboard anymore. Do you want to continue?`)) return;
        }
        else {
            if (!confirm(`By activating this keyword, the associated articles will be shown in your dashboard. Do you want to continue?`)) return;
        }

        setPendingToggleKeywordId(keyword.id);
        toggleKeywordMutation.mutate({ data: { keywordId: keyword.id, active: !keyword.active } }, {
            onError: () => {
                setPendingToggleKeywordId(null);
                toast.error("Failed to toggle the keyword");
            },
            onSuccess: () => {
                setPendingToggleKeywordId(null);
            },
        });
    };

    return (
        <PageTitle title="Keyword Manager" subtitle="Manage your RSS keywords.">
            <div className="mt-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="w-full sm:w-100 sm:max-w-full">
                        <div className="relative">
                            <Tags className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle"/>
                            <Input
                                value={newKeyword}
                                className="pl-9"
                                placeholder="Add a keyword..."
                                onChange={(ev) => {
                                    setNewKeyword(ev.target.value);
                                    if (errorMessage) setErrorMessage("");
                                }}
                                onKeyDown={(ev) => {
                                    if (ev.key === "Enter") {
                                        ev.preventDefault();
                                        handleAddNewKeyword();
                                    }
                                }}
                            />
                        </div>
                        {errorMessage &&
                            <p className="mt-2 text-sm text-danger-foreground">
                                {errorMessage}
                            </p>
                        }
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleAddNewKeyword}
                        disabled={addKeywordMutation.isPending || trimmedKeyword.length === 0}
                        className="w-full border border-primary/30 bg-primary/15 hover:bg-primary/25 sm:w-auto"
                    >
                        {addKeywordMutation.isPending ?
                            <Loader2 className="size-4 animate-spin"/>
                            :
                            <Plus className="size-4"/>
                        }
                        Add Keyword
                    </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-foreground-muted">
                    <StatPill label="Total" value={userKeywords.length}/>
                    <StatPill label="Active" value={activeCount}/>
                    <StatPill label="Paused" value={inactiveCount}/>
                    <StatPill label="Linked articles" value={totalLinkedArticles}/>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-dashed">
                {sortedKeywords.length === 0 ?
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        No keywords added yet.
                    </div>
                    :
                    <div className="divide-y divide-border-subtle">
                        {sortedKeywords.map((keyword) => {
                            const isToggling = pendingToggleKeywordId === keyword.id;
                            const isDeleting = pendingDeleteKeywordId === keyword.id;
                            const isActionLocked = pendingToggleKeywordId !== null || pendingDeleteKeywordId !== null;

                            return (
                                <div
                                    key={keyword.id}
                                    className="flex flex-col gap-4 px-4 py-3 transition-colors hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-3 self-stretch sm:self-auto">
                                        <span
                                            className={cn(
                                                "size-2 shrink-0 rounded-full",
                                                keyword.active ? "bg-success" : "bg-foreground-subtle/60",
                                            )}
                                            aria-hidden="true"
                                        />
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-foreground-soft" title={keyword.name}>
                                                    {keyword.name}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "rounded-full border px-2 py-0.5 text-[11px]",
                                                        keyword.active
                                                            ? "border-success-border bg-success-muted text-success-foreground"
                                                            : "border-border-subtle bg-surface-muted text-foreground-muted",
                                                    )}
                                                >
                                                    {keyword.active ? "Active" : "Paused"}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-foreground-subtle">
                                                <span>{formatCount(keyword.totalArticles)} total</span>
                                                <span>{formatCount(keyword.archivedArticles)} archived</span>
                                                <span>{formatCount(keyword.deletedArticles)} deleted</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            title={keyword.active ? "Pause keyword" : "Activate keyword"}
                                            disabled={isActionLocked}
                                            onClick={() => handleToggleKeyword(keyword)}
                                            className="h-8 w-full border border-border-strong bg-transparent px-3 text-foreground-soft hover:bg-surface-hover hover:text-foreground sm:w-auto"
                                        >
                                            {isToggling ?
                                                <Loader2 className="size-4 animate-spin"/>
                                                : keyword.active ?
                                                    <PauseCircle className="size-4"/>
                                                    :
                                                    <PlayCircle className="size-4"/>
                                            }
                                            {keyword.active ? "Pause" : "Activate"}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title="Delete keyword"
                                            disabled={isActionLocked}
                                            onClick={() => handleDeleteKeyword(keyword)}
                                            className="h-8 w-full text-foreground-muted hover:bg-danger-muted hover:text-danger-foreground sm:size-8"
                                        >
                                            {isDeleting ?
                                                <Loader2 className="size-4 animate-spin"/>
                                                :
                                                <Trash2 className="size-4"/>
                                            }
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                }
            </div>
        </PageTitle>
    );
}


function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
            {label}: {value}
        </span>
    );
}


function formatCount(value: unknown) {
    return Number(value ?? 0);
}
