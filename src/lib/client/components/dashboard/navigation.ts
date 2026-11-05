import {Archive, Newspaper, Rss, Settings, Tags, Trash} from "lucide-react";
import type {LinkProps} from "@tanstack/react-router";
import type {LucideIcon} from "lucide-react";


interface NavigationItem {
    title: string;
    to: LinkProps["to"];
    icon: LucideIcon;
    group?: {title: string; to: LinkProps["to"]};
}

declare module "@tanstack/react-router" {
    interface StaticDataRouteOption {
        navigation?: NavigationItem;
    }
}


const dashboard = {title: "Dashboard", to: "/dashboard/articles"} as const;
const managers = {title: "Managers", to: "/rss-manager"} as const;


export const navigation = {
    articles: {title: "Articles", to: "/dashboard/articles", icon: Newspaper, group: dashboard},
    archived: {title: "Archived", to: "/dashboard/archived", icon: Archive, group: dashboard},
    trash: {title: "Trash Bin", to: "/dashboard/trash-bin", icon: Trash, group: dashboard},
    feeds: {title: "RSS Feeds", to: "/rss-manager", icon: Rss, group: managers},
    keywords: {title: "Keywords", to: "/keywords", icon: Tags, group: managers},
    settings: {title: "Settings", to: "/settings", icon: Settings},
} as const satisfies Record<string, NavigationItem>;


export const navigationGroups = [
    {title: dashboard.title, items: [navigation.articles, navigation.archived, navigation.trash]},
    {title: managers.title, items: [navigation.feeds, navigation.keywords]},
];
