import {Link, useMatchRoute} from "@tanstack/react-router";
import {navigationGroups} from "@/lib/client/components/dashboard/navigation";
import {SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";


export function NavMain() {
    const matchRoute = useMatchRoute();
    const {setOpenMobile} = useSidebar();

    return navigationGroups.map(group =>
        <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
                {group.items.map(item =>
                    <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                            tooltip={item.title}
                            isActive={!!matchRoute({to: item.to})}
                            render={<Link to={item.to} onClick={() => setOpenMobile(false)}/>}
                        >
                            <item.icon aria-hidden="true"/>
                            <span>{item.title}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
