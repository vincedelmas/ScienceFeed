import {Search, X} from "lucide-react";
import {type ChangeEvent, useRef} from "react";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from "@/lib/client/components/ui/input-group";


interface InputSearchProps {
    search: string;
    isDisabled: boolean;
    onResetClick: () => void;
    onChange: (ev: ChangeEvent<HTMLInputElement>) => void;
}


export const InputSearch = ({ search, isDisabled, onChange, onResetClick }: InputSearchProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <InputGroup className="sm:max-w-96">
            <InputGroupAddon>
                <Search aria-hidden="true"/>
            </InputGroupAddon>

            <InputGroupInput
                ref={inputRef}
                value={search}
                onChange={onChange}
                disabled={isDisabled}
                aria-label="Search articles"
                placeholder="Search articles…"
            />

            {search.length > 0 &&
                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        size="icon-xs"
                        title="Clear article search"
                        aria-label="Clear article search"
                        disabled={isDisabled}
                        onClick={() => {
                            onResetClick();
                            inputRef.current?.focus();
                        }}
                    >
                        <X aria-hidden="true"/>
                    </InputGroupButton>
                </InputGroupAddon>
            }
        </InputGroup>
    );
}
