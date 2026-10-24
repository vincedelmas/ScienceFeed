import * as React from "react";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {GeneralSettings} from "@/lib/schemas/schemas";
import {toast} from "@/lib/client/components/ui/toast";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {useGeneralMutation} from "@/lib/client/react-query/mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/client/components/ui/form";


export const GeneralForm = () => {
    const { currentUser } = useAuth();
    const generalFormMutation = useGeneralMutation();
    const [errorMessage, setErrorMessage] = useState("");
    const form = useForm<GeneralSettings>({
        defaultValues: {
            name: currentUser?.name ?? "",
        },
    });

    const onSubmit = (data: GeneralSettings) => {
        setErrorMessage("");

        generalFormMutation.mutate({ data }, {
            onError: (error) => setErrorMessage(error.message),
            onSuccess: () => toast.add({ type: "success", title: "Settings successfully updated" }),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-87.5 max-sm:w-full">
                <div className="space-y-8">
                    {errorMessage &&
                        <p className="text-destructive text-sm">
                            {errorMessage}
                        </p>
                    }
                    <FormField
                        control={form.control}
                        name="name"
                        rules={{
                            minLength: { value: 3, message: "The username is too short (3 min)" },
                            maxLength: { value: 15, message: "The username is too long (15 max)" },
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl render={<Input {...field}/>}/>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <Button className="mt-6" disabled={generalFormMutation.isPending}>
                    Update
                </Button>
            </form>
        </Form>
    );
};
