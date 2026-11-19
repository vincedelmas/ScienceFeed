import type {ReactNode} from "react";
import {Badge} from "@/lib/client/components/ui/badge";
import {MutedText} from "@/lib/client/components/muted-text";
import {Separator} from "@/lib/client/components/ui/separator";


interface PageHeaderProps {
    title: string;
    count?: number;
    subtitle?: string;
    children?: ReactNode;
}


export function PageHeader({ children, title, count, subtitle }: PageHeaderProps) {
    return (
        <div className="mt-2">
            <header>
                <div className="flex items-center gap-2 text-2xl font-medium">
                    <h1>{title}</h1>
                    {count !== undefined &&
                        <Badge variant="outline" className="mt-1 py-3 text-sm border-primary/20 bg-primary/10 text-primary tabular-nums">
                            {count}
                        </Badge>
                    }
                </div>
                {subtitle &&
                    <MutedText className="text-muted-foreground not-italic">
                        {subtitle}
                    </MutedText>
                }
                <Separator className="mt-1"/>
            </header>
            {children}
        </div>
    );
}

