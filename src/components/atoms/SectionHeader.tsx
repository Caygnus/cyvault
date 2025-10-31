import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string | ReactNode;
    titleClassName?: string;
    children?: ReactNode;
}

export const SectionHeader: FC<SectionHeaderProps> = ({ title, titleClassName, children }) => {
    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className={cn("text-3xl font-bold", titleClassName)}>
                {title}
            </h1>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    );
};

