import {Rss, Tags} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";


const items = [
    {
        icon: Rss,
        name: "RSS Feeds",
        url: "/rss-manager",
    },
    {
        icon: Tags,
        name: "Keywords",
        url: "/keywords",
    },
];


export function NavManagers() {
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Managers</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton tooltip={item.name} render={<Link to={item.url} onClick={() => setOpenMobile(false)}/>}>
                            <item.icon/>
                            <span>{item.name}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
