import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {Loader2, Plus} from "lucide-react";
import {CreateRssFeed} from "@/lib/schemas/schemas";
import {toast} from "@/lib/client/components/ui/toast";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {useCreateRssFeedMutation} from "@/lib/client/react-query/mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/client/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/lib/client/components/ui/dialog";


export function CreateNewRSSFeed() {
    const [open, setOpen] = useState(false);
    const createRssFeedMutation = useCreateRssFeedMutation();
    const form = useForm<CreateRssFeed>({
        mode: "onChange",
        defaultValues: {
            url: "",
            journal: "",
            publisher: "",
        },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        if (createRssFeedMutation.isPending) return;

        setOpen(nextOpen);
        if (!nextOpen) {
            form.reset();
        }
    };

    const onSubmit = (data: CreateRssFeed) => {
        createRssFeedMutation.mutate({
            data: {
                url: data.url.trim(),
                journal: data.journal.trim(),
                publisher: data.publisher.trim(),
            },
        }, {
            onError: (error) => {
                return toast.add({ type: "error", title: error?.message ?? "Failed to add this RSS Feed" });
            },
            onSuccess: () => {
                form.reset();
                setOpen(false);
                toast.add({ type: "success", title: "RSS Feed successfully added" });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        size="sm"
                        variant="ghost"
                        className="w-full border border-primary/30 bg-primary/15 hover:bg-primary/25 sm:w-auto"
                    />
                }
            >
                <Plus className="size-4"/> Add RSS Feed
            </DialogTrigger>
            <DialogContent className="border-border-subtle bg-surface-elevated">
                <DialogHeader>
                    <DialogTitle>
                        Add RSS Feed
                    </DialogTitle>
                    <DialogDescription>
                        Add a new RSS feed to your account.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="url"
                            control={form.control}
                            rules={{
                                required: { value: true, message: "URL cannot be empty" },
                                validate: (value) => {
                                    try {
                                        new URL(value);
                                        return true;
                                    }
                                    catch {
                                        return "Enter a valid URL";
                                    }
                                },
                            }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL</FormLabel>
                                    <FormControl
                                        render={
                                            <Input
                                                {...field}
                                                placeholder="https://feeds.rsc.org/rss/cp"
                                            />
                                        }
                                    />
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="journal"
                            rules={{ required: { value: true, message: "Journal name cannot be empty" } }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Journal</FormLabel>
                                    <FormControl
                                        render={
                                            <Input
                                                placeholder="Journal name"
                                                {...field}
                                            />
                                        }
                                    />
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="publisher"
                            rules={{ required: { value: true, message: "Publisher name cannot be empty" } }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Publisher</FormLabel>
                                    <FormControl
                                        render={
                                            <Input
                                                {...field}
                                                placeholder="Publisher name"
                                            />
                                        }
                                    />
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={createRssFeedMutation.isPending || !form.formState.isDirty || !form.formState.isValid}
                        >
                            {createRssFeedMutation.isPending
                                ? <><Loader2 className="animate-spin"/> Adding...</>
                                : "Add Feed"
                            }
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
