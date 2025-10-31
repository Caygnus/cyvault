import { FC } from "react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

interface PageProps {
    children?: React.ReactNode;
    className?: string;
    type?: "left-aligned" | "default";
    header?: React.ReactNode;
    heading?: string | React.ReactNode;
    headingClassName?: string;
    headingCTA?: React.ReactNode;
}

export const Page: FC<PageProps> = ({
    children,
    className,
    type = "default",
    header,
    heading,
    headingClassName,
    headingCTA,
}) => {
    if (heading && header) {
        throw new Error("You cannot pass both heading and header props");
    }

    return (
        <div className="min-h-screen flex flex-col">
            <div
                className={cn(
                    "flex-1 page w-full py-8",
                    type === "left-aligned" && "px-12",
                    type === "default" && "mx-auto max-w-5xl px-4",
                    className
                )}
            >
                {header && header}
                {heading && (
                    <SectionHeader
                        title={heading}
                        titleClassName={cn(headingClassName, "text-3xl font-bold")}
                    >
                        {headingCTA}
                    </SectionHeader>
                )}
                <div className="pb-12 mt-2">{children}</div>
            </div>
        </div>
    );
};

