import {navigation} from "@/lib/client/components/dashboard/navigation";
import {createFileRoute} from "@tanstack/react-router";
import {userArticlesOptions} from "@/lib/client/react-query";
import {userArticlesSearchSchema} from "@/lib/schemas/schemas";
import {ArticleDashboard} from "@/lib/client/components/articles/article-dashboard";


export const Route = createFileRoute("/_private/dashboard/articles")({
    staticData: {navigation: navigation.articles},
    validateSearch: userArticlesSearchSchema,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.query({ ...userArticlesOptions(search), staleTime: "static" });
    },
    component: ArticlesPage,
});


function ArticlesPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();

    return (
        <ArticleDashboard
            mode="active"
            filters={filters}
            title="Articles"
            subtitle="Your recent RSS feed articles"
            onSearchChange={(search) => navigate({ search })}
        />
    );
}
