import {Rss, Search, Bookmark} from "lucide-react";


const features = [
    {icon: Rss, title: "RSS feeds", description: "Add and manage the feeds you want to follow."},
    {icon: Search, title: "Keyword filters", description: "Filter incoming articles by your keywords."},
    {icon: Bookmark, title: "Article management", description: "Archive articles or move them to the trash."},
];


export const Features = () => (
    <section id="how-it-works" aria-labelledby="features-title" className="border-t border-border-subtle py-8">
        <h2 id="features-title" className="mb-6 text-lg font-semibold">What it does</h2>
        <div className="grid gap-4 md:grid-cols-3">
            {features.map(({icon: Icon, title, description}) =>
                <div key={title} className="py-2">
                    <div className="mb-5 flex items-center gap-3 text-primary">
                        <Icon className="size-5" aria-hidden="true"/>
                    </div>
                    <h3 className="mb-3 text-base font-medium">{title}</h3>
                    <p className="max-w-sm text-sm leading-relaxed text-foreground-muted">{description}</p>
                </div>
            )}
        </div>
    </section>
);
