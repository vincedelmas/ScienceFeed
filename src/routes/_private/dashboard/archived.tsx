import {createFileRoute} from "@tanstack/react-router";
import {userArticlesSearchSchema} from "@/lib/schemas/schemas";
import {userArticleListOptions} from "@/lib/client/react-query";
import {navigation} from "@/lib/client/components/dashboard/navigation";
import {ArticleDashboard} from "@/lib/client/components/articles/article-dashboard";


export const Route = createFileRoute("/_private/dashboard/archived")({
    validateSearch: userArticlesSearchSchema,
    loaderDeps: ({ search }) => ({ search }),
    context: ({ deps: { search } }) => ({
        articleQueryOptions: userArticleListOptions("archived", search),
    }),
    loader: ({ context: { queryClient, articleQueryOptions } }) => {
        return queryClient.query({ ...articleQueryOptions, staleTime: "static" });
    },
    staticData: { navigation: navigation.archived },
    head: () => ({ meta: [{ title: `${navigation.archived.title} - ScienceFeed` }] }),
    component: ArchivedPage,
});


function ArchivedPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { articleQueryOptions } = Route.useRouteContext();

    return (
        <ArticleDashboard
            mode="archived"
            filters={filters}
            title={navigation.archived.title}
            subtitle="Articles you have archived"
            articleQueryOptions={articleQueryOptions}
            onSearchChange={(search) => navigate({ search })}
        />
    );
}
