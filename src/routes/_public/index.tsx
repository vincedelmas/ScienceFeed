import {LoaderCircle} from "lucide-react";
import {useEffect, useState} from "react";
import authClient from "@/lib/utils/auth-client";
import {toast} from "@/lib/client/components/ui/toast";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {Features} from "@/lib/client/components/homepage/features";


export const Route = createFileRoute("/_public/")({
    component: HomePage,
});


function HomePage() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Back navigation from Google can restore this page with its loading state intact.
        const handlePageShow = () => setIsLoading(false);
        window.addEventListener("pageshow", handlePageShow);
        return () => window.removeEventListener("pageshow", handlePageShow);
    }, []);

    const handleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard/articles"
        }, {
            onRequest: () => {
                setIsLoading(true);
            },
            onError: (ctx) => {
                setIsLoading(false);
                toast.add({ type: "error", title: ctx.error.message });
            },
        });
    };

    return (
        <main className="min-h-svh bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <header className="flex h-16 items-center gap-3 border-b border-border-subtle">
                    <img src="/favicon.svg" alt="" className="size-7 shrink-0"/>
                    <span className="text-xl">Science-Feed</span>
                </header>

                <section className="max-w-2xl py-12 sm:py-16">
                    <h1 className="text-3xl font-semibold tracking-tight">A science RSS reader.</h1>
                    <p className="mt-4 text-base leading-7 text-foreground-muted">
                        ScienceFeed is an open-source project for following science articles.
                        Add RSS feeds, filter by keyword, and archive articles you’ve read.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                        <Button onClick={handleLogin} disabled={isLoading} size="lg">
                            <span className="grid" aria-live="polite">
                                <span className={`col-start-1 row-start-1 ${isLoading ? "invisible" : ""}`} aria-hidden={isLoading}>
                                    Sign in with Google
                                </span>
                                <span className={`col-start-1 row-start-1 flex items-center justify-center gap-1.5 ${isLoading ? "" : "invisible"}`} aria-hidden={!isLoading}>
                                    <LoaderCircle className="animate-spin" aria-hidden="true"/>
                                    Signing in…
                                </span>
                            </span>
                        </Button>
                        <a href="https://github.com/vincedelmas/ScienceFeed" className="rounded-sm text-sm text-foreground-muted underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
                            Source code on GitHub
                        </a>
                    </div>
                </section>

                <Features/>
            </div>
        </main>
    );
}
