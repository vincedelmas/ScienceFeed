import React from "react";
import {MutedText} from "@/lib/client/components/muted-text";
import {Separator} from "@/lib/client/components/ui/separator";


interface PageTitleProps {
    title: string;
    subtitle?: string;
    onlyHelmet?: boolean;
    children?: React.ReactNode;
}


export const PageTitle = ({ children, title, subtitle, onlyHelmet = false }: PageTitleProps) => {
    return (
        <>
            <title>{`${title} - ScienceFeed`}</title>
            {onlyHelmet ?
                children
                :
                <div className="mt-2">
                    <div className="text-2xl font-medium">
                        {title}
                    </div>
                    <MutedText className="text-muted-foreground not-italic">
                        {subtitle}
                    </MutedText>
                    <Separator className="mt-1"/>
                    {children}
                </div>
            }
        </>
    );
};

