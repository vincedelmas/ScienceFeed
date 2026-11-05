import * as React from "react";
import {Link} from "@tanstack/react-router";
import {NavUser} from "@/lib/client/components/dashboard/nav-user";
import {NavMain} from "@/lib/client/components/dashboard/nav-main";
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { setOpenMobile } = useSidebar();

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Science-Feed" render={<Link to="/dashboard/articles" onClick={() => setOpenMobile(false)}/>}>
                            <img src="/favicon.svg" alt="" className="size-4 shrink-0"/>
                            <span className="truncate text-lg group-data-[collapsible=icon]:hidden">Science-Feed</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser/>
            </SidebarFooter>
        </Sidebar>
    );
}
