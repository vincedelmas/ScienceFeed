import authClient from "@/lib/utils/auth-client";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {authOptions} from "@/lib/client/react-query";
import {useQueryClient} from "@tanstack/react-query";
import {ChevronsUpDown, LogOut, Settings} from "lucide-react";
import {Link, useNavigate, useRouter} from "@tanstack/react-router";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/client/components/ui/avatar";
import {SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar} from "@/lib/client/components/ui/sidebar";
import {DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


export function NavUser() {
    const router = useRouter();
    const navigate = useNavigate();
    const { isMobile } = useSidebar();
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
                                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                            />
                        }
                    >
                        <Avatar className="size-9 rounded-lg">
                            <AvatarImage
                                src="#"
                                alt={currentUser?.name}
                            />
                            <AvatarFallback className="rounded-lg">
                                {currentUser?.name.slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                {currentUser?.name}
                            </span>
                            <span className="truncate text-xs">
                                {currentUser?.email}
                            </span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4"/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        side={isMobile ? "bottom" : "right"}
                        className="w-(--anchor-width) min-w-56 rounded-lg"
                    >
                        <DropdownMenuGroup>
                            <DropdownMenuItem render={<Link to="/settings"/>}>
                                <Settings/> Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => logoutUser()}>
                                <LogOut className="w-5 h-5"/> Logout
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
