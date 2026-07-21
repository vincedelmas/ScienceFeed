import React from "react";
import {Search} from "lucide-react";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";


interface InputSearchProps {
    search: string;
    isDisabled: boolean;
    onResetClick: () => void;
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => void;
}


export const InputSearch = ({ search, isDisabled, onChange, onResetClick }: InputSearchProps) => {
    return (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-100 sm:max-w-full">
                <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="text"
                    value={search}
                    className="pl-9"
                    onChange={onChange}
                    disabled={isDisabled}
                    aria-label="Search articles"
                    placeholder="Search articles..."
                />
            </div>
            {search.length > 0 &&
                <Button size="sm" onClick={onResetClick} disabled={isDisabled} className="w-full sm:w-auto">
                    Cancel
                </Button>
            }
        </div>
    );
}
