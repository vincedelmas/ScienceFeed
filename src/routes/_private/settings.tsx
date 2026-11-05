import {navigation} from "@/lib/client/components/dashboard/navigation";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/page-title";
import {GeneralForm} from "@/lib/client/components/settings/general-form";


export const Route = createFileRoute("/_private/settings")({
    staticData: {navigation: navigation.settings},
    component: SettingsPage,
});


function SettingsPage() {
    return (
        <PageTitle title="Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <div className="mt-8">
                <GeneralForm/>
            </div>
        </PageTitle>
    );
}