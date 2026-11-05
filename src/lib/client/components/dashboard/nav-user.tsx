import {navigation} from "@/lib/client/components/dashboard/navigation";
import authClient from "@/lib/utils/auth-client";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {authOptions} from "@/lib/client/react-query";
import {useQueryClient} from "@tanstack/react-query";
import {ChevronsUpDown, LogOut} from "lucide-react";
import {Link, useNavigate, useRouter} from "@tanstack/react-router";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/client/components/ui/avatar";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


export function NavUser() {
    const router = useRouter();
    const navigate = useNavigate();
    const { isMobile, setOpenMobile } = useSidebar();
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const logoutUser = async () => {
        await authClient.signOut();
        await router.invalidate();
        queryClient.setQueryData(authOptions.queryKey, null);
        queryClient.removeQueries();
        await navigate({ to: "/", replace: true });
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                tooltip={currentUser?.name}
                                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                            />
                        }
                    >
                        <Avatar className="size-9 rounded-lg">
                            <AvatarImage
                                src={currentUser?.image ?? undefined}
                                alt={currentUser?.name}
                            />
                            <AvatarFallback className="rounded-lg">
                                {currentUser?.name.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-semibold">
                                {currentUser?.name}
                            </span>
                            <span className="truncate text-xs">
                                {currentUser?.email}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden"/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        side={isMobile ? "bottom" : "right"}
                        className="w-(--anchor-width) min-w-56 rounded-lg"
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link to={navigation.settings.to} onClick={() => setOpenMobile(false)}/>}>
                                <navigation.settings.icon aria-hidden="true"/> {navigation.settings.title}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => logoutUser()}>
                                <LogOut className="size-4"/> Logout
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
