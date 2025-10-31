import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
    children?: ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: FC<CardProps> = ({ children, className, onClick }) => {
    return (
        <div
            className={cn(
                "bg-white border border-gray-200 rounded-lg transition-all",
                onClick && "cursor-pointer hover:shadow-md",
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

