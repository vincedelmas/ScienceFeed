import {createFileRoute} from "@tanstack/react-router";
import {userArticlesSearchSchema} from "@/lib/schemas/schemas";
import {userArticleListOptions} from "@/lib/client/react-query";
import {navigation} from "@/lib/client/components/dashboard/navigation";
import {ArticleDashboard} from "@/lib/client/components/articles/article-dashboard";


export const Route = createFileRoute("/_private/dashboard/trash-bin")({
    validateSearch: userArticlesSearchSchema,
    loaderDeps: ({ search }) => ({ search }),
    context: ({ deps: { search } }) => ({
        articleQueryOptions: userArticleListOptions("deleted", search),
    }),
    loader: ({ context: { queryClient, articleQueryOptions } }) => {
        return queryClient.query({ ...articleQueryOptions, staleTime: "static" });
    },
    staticData: { navigation: navigation.trash },
    head: () => ({ meta: [{ title: `${navigation.trash.title} - ScienceFeed` }] }),
    component: TrashBinPage,
});


function TrashBinPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { articleQueryOptions } = Route.useRouteContext();

    return (
        <ArticleDashboard
            mode="deleted"
            filters={filters}
            title={navigation.trash.title}
            subtitle="Articles you have removed"
            articleQueryOptions={articleQueryOptions}
            onSearchChange={(search) => navigate({ search })}
        />
    );
}
