import {navigation} from "@/lib/client/components/dashboard/navigation";
import {createFileRoute} from "@tanstack/react-router";
import {userArchivedOptions} from "@/lib/client/react-query";
import {userArticlesSearchSchema} from "@/lib/schemas/schemas";
import {ArticleDashboard} from "@/lib/client/components/articles/article-dashboard";


export const Route = createFileRoute("/_private/dashboard/archived")({
    staticData: {navigation: navigation.archived},
    validateSearch: userArticlesSearchSchema,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(userArchivedOptions(search));
    },
    component: ArchivedPage,
});


function ArchivedPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();

    return (
        <ArticleDashboard
            mode="archived"
            title="Archived"
            filters={filters}
            subtitle="Articles you have archived"
            onSearchChange={(search) => navigate({ search })}
        />
    );
}
