import {useState} from "react";
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <section className="pt-28 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Stay Updated with ScienceFeed</h1>
                    <p className="text-xl mb-12">Curate your personal science news feed with RSS and keywords</p>
                </div>
            </section>
            <div className="flex items-center justify-center gap-3 mb-12">
                <Button onClick={handleLogin} disabled={isLoading}>
                    Login with Google
                </Button>
            </div>
            <Features/>
        </main>
    );
}
