import {Link} from "@tanstack/react-router";
import {Archive, Newspaper, Trash} from "lucide-react";
import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";


const items = [
    {
        icon: Newspaper,
        name: "Articles",
        url: "/dashboard/articles",
    },
    {
        icon: Archive,
        name: "Archived",
        url: "/dashboard/archived",
    },
    {
        icon: Trash,
        name: "Trash Bin",
        url: "/dashboard/trash-bin",
    },
];


export function NavDashboard() {
    const { setOpenMobile } = useSidebar();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
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
