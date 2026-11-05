import {authOptions} from "@/lib/client/react-query";
import {AppSidebar} from "@/lib/client/components/dashboard/app-sidebar";
import {createFileRoute, Link, Outlet, redirect, useMatches} from "@tanstack/react-router";
import {SidebarInset, SidebarProvider, SidebarTrigger} from "@/lib/client/components/ui/sidebar";
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from "@/lib/client/components/ui/breadcrumb";


export const Route = createFileRoute("/_private")({
    beforeLoad: ({ context: { queryClient } }) => {
        const currentUser = queryClient.getQueryData(authOptions.queryKey);

        if (!currentUser) {
            throw redirect({ to: "/", replace: true });
        }
    },
    component: PrivateLayout,
});


function PrivateLayout() {
    const currentNavigation = useMatches({
        select: matches => matches.slice().reverse().find(match => match.staticData.navigation)?.staticData.navigation,
    });

    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <header
                    className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-background/95 backdrop-blur transition-[width,height] ease-linear
                    group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex min-w-0 items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1"/>
                        {currentNavigation &&
                            <Breadcrumb className="min-w-0">
                                <BreadcrumbList>
                                    {currentNavigation.group &&
                                        <>
                                            <BreadcrumbItem className="hidden md:inline-flex">
                                                <BreadcrumbLink render={<Link to={currentNavigation.group.to}/>}>
                                                    {currentNavigation.group.title}
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="hidden md:block"/>
                                        </>
                                    }
                                    <BreadcrumbItem className="min-w-0">
                                        <BreadcrumbPage className="truncate">
                                            {currentNavigation.title}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        }
                    </div>
                </header>
                <div className="mx-auto mb-20 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <Outlet/>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
