import {createFileRoute} from "@tanstack/react-router";
import {PageHeader} from "@/lib/client/components/page-header";
import {navigation} from "@/lib/client/components/dashboard/navigation";
import {GeneralForm} from "@/lib/client/components/settings/general-form";


export const Route = createFileRoute("/_private/settings")({
    staticData: { navigation: navigation.settings },
    head: () => ({ meta: [{ title: `${navigation.settings.title} - ScienceFeed` }] }),
    component: SettingsPage,
});


function SettingsPage() {
    return (
        <PageHeader title={navigation.settings.title} subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="mt-8">
                <GeneralForm/>
            </div>
        </PageHeader>
    );
}