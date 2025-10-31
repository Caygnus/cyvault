"use client";

import { FC, ReactNode } from "react";
import { Page, AddButton, Card } from "@/components/atoms";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EmptyStateCardItem {
    icon?: ReactNode;
    heading?: string;
    description?: string;
    buttonLabel?: string;
    buttonAction?: () => void;
}

export interface CardItem {
    imageUrl?: string;
    heading?: string;
    description?: string;
    onClick?: () => void;
}

interface TutorialItem {
    imageUrl?: string;
    title: string;
    onClick?: () => void;
}

interface EmptyPageProps {
    onAddClick?: () => void;
    heading?: string;
    children?: ReactNode;
    addButtonLabel?: string;
    emptyStateCard?: EmptyStateCardItem;
    tutorials?: TutorialItem[];
}

export const EmptyPage: FC<EmptyPageProps> = ({
    onAddClick,
    heading,
    children,
    addButtonLabel,
    emptyStateCard,
    tutorials,
}) => {
    const card = emptyStateCard;
    return (
        <Page
            heading={heading}
            headingCTA={
                onAddClick && (
                    <AddButton
                        label={addButtonLabel}
                        onClick={() => {
                            if (onAddClick) {
                                onAddClick();
                            }
                        }}
                    />
                )
            }
        >
            <div className="bg-[#fafafa] border border-[#E9E9E9] rounded-xl w-full max-w-[1008px] h-[360px] flex flex-col items-center justify-center mx-auto">
                {card?.icon && <div className="mb-8">{card?.icon}</div>}
                {card?.heading && (
                    <div className="font-medium text-[20px] leading-normal text-gray-700 mb-4 text-center">
                        {card?.heading}
                    </div>
                )}
                {card?.description && (
                    <div className="font-normal bg-[#F9F9F9] text-[16px] leading-normal text-gray-400 mb-8 text-center max-w-[350px]">
                        {card?.description}
                    </div>
                )}
                {card?.buttonAction && card?.buttonLabel && (
                    <Button
                        variant={"outline"}
                        onClick={card?.buttonAction}
                        className="p-5 bg-[#fbfbfb] border-[#CFCFCF]"
                    >
                        {card?.buttonLabel}
                    </Button>
                )}
            </div>
            {children}

            {/* Tutorial cards section */}
            {tutorials && tutorials.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
                    {tutorials.map((item, index) => {
                        const imageUrl =
                            item.imageUrl && item.imageUrl.trim() !== ""
                                ? item.imageUrl
                                : "https://mintlify.s3.us-west-1.amazonaws.com/flexprice/UsageBaseMetering(1).jpg";
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                key={index}
                            >
                                <Card
                                    className={cn(
                                        "h-full group bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 flex flex-col max-w-[280px] mx-auto p-4",
                                        "aspect-auto bg-gradient-to-r from-[#ffffff] to-[#fcfcfc]"
                                    )}
                                    onClick={item.onClick}
                                >
                                    {/* Image at the top */}
                                    <div className="w-full h-[80px] aspect-video rounded-t-lg overflow-hidden bg-[#f5f5f5] flex items-center justify-center">
                                        <Image
                                            src={imageUrl}
                                            width={280}
                                            height={80}
                                            className="object-cover bg-gray-100 w-full h-full"
                                            alt={item.title || "Tutorial"}
                                        />
                                    </div>
                                    {/* Content below image */}
                                    <div className="flex-1 flex flex-col justify-between mt-4">
                                        <div>
                                            <h3 className="text-slate-800 text-base font-medium group-hover:text-gray-600 transition-colors duration-200 text-left">
                                                {item.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1 mt-8 text-slate-400 group-hover:text-gray-500 transition-all duration-200 text-left">
                                            <span className="text-xs font-regular">Learn More</span>
                                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </Page>
    );
};

