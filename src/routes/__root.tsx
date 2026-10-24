/// <reference types="vite/client"/>
import React, {lazy} from "react";
import appCss from "@/styles.css?url";
import {authOptions} from "@/lib/client/react-query";
import type {QueryClient} from "@tanstack/react-query";
import {Toaster} from "@/lib/client/components/ui/toast";
import {useNProgress} from "@/lib/client/hooks/use-nprogress";
import {TooltipProvider} from "@/lib/client/components/ui/tooltip";
import {createRootRouteWithContext, HeadContent, Outlet, Scripts} from "@tanstack/react-router";


export const Route = createRootRouteWithContext<{ queryClient: QueryClient; }>()({
    ssr: false,
    beforeLoad: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(authOptions);
    },
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "ScienceFeed" },
            { name: "description", content: "A science rss feed for the web." },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: RootComponent,
    shellComponent: RootComponent,
});


function RootComponent() {
    useNProgress();

    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <HeadContent/>
            </head>
            <body>

                <TooltipProvider>
                    <Toaster>
                        <Outlet/>
                    </Toaster>
                </TooltipProvider>

                {import.meta.env.DEV &&
                    <ReactQueryDevtools buttonPosition="bottom-right"/>
                }

                <Scripts/>
            </body>
        </html>
    );
}


const ReactQueryDevtools = lazy(() =>
    import("@tanstack/react-query-devtools").then((res) => ({ default: res.ReactQueryDevtools }))
);
