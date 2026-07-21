import {authOptions} from "@/lib/client/react-query";
import {createFileRoute, redirect} from "@tanstack/react-router";


export const Route = createFileRoute("/_public")({
    validateSearch: ({ search }) => search as { authExpired?: boolean },
    beforeLoad: async ({ context: { queryClient }, search }) => {
        const currentUser = queryClient.getQueryData(authOptions.queryKey);

        if (search.authExpired) {
            queryClient.clear();
            throw redirect({ to: "/", search: { authExpired: undefined }, replace: true });
        }

        if (currentUser) {
            throw redirect({ to: "/dashboard/articles", replace: true });
        }
    },
});
