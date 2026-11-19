import {createFileRoute} from "@tanstack/react-router";
import {userArticlesSearchSchema} from "@/lib/schemas/schemas";
import {userArticleListOptions} from "@/lib/client/react-query";
import {navigation} from "@/lib/client/components/dashboard/navigation";
import {ArticleDashboard} from "@/lib/client/components/articles/article-dashboard";


export const Route = createFileRoute("/_private/dashboard/articles")({
    validateSearch: userArticlesSearchSchema,
    loaderDeps: ({ search }) => ({ search }),
    context: ({ deps: { search } }) => ({
        articleQueryOptions: userArticleListOptions("active", search),
    }),
    loader: ({ context: { queryClient, articleQueryOptions } }) => {
        return queryClient.query({ ...articleQueryOptions, staleTime: "static" });
    },
    staticData: { navigation: navigation.articles },
    head: () => ({ meta: [{ title: `${navigation.articles.title} - ScienceFeed` }] }),
    component: ArticlesPage,
});


function ArticlesPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { articleQueryOptions } = Route.useRouteContext();

    return (
        <ArticleDashboard
            mode="active"
            filters={filters}
            title={navigation.articles.title}
            subtitle="Your recent RSS feed articles"
            articleQueryOptions={articleQueryOptions}
            onSearchChange={(search) => navigate({ search })}
        />
    );
}
