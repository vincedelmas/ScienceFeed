import React from "react";
import {Badge} from "@/lib/client/components/ui/badge";
import {MutedText} from "@/lib/client/components/muted-text";
import {Separator} from "@/lib/client/components/ui/separator";


interface PageTitleProps {
    title: string;
    count?: number;
    subtitle?: string;
    onlyHelmet?: boolean;
    children?: React.ReactNode;
}


export const PageTitle = ({ children, title, count, subtitle, onlyHelmet = false }: PageTitleProps) => {
    return (
        <>
            <title>{`${title} - ScienceFeed`}</title>
            {onlyHelmet ?
                children
                :
                <div className="mt-2">
                    <div className="flex items-center gap-2 text-2xl font-medium">
                        {title}
                        {count !== undefined &&
                            <Badge variant="outline" className="mt-1 py-3 text-sm border-primary/20 bg-primary/10 text-primary tabular-nums">
                                {count}
                            </Badge>
                        }
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

