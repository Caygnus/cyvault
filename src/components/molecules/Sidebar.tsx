"use client"

import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"
import SidebarNav, { NavItem } from "./SidebarMenu"
import SidebarFooterComponent from "./SidebarFooter"
import { cn } from "@/lib/utils"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    navItems?: NavItem[]
}

const AppSidebar: React.FC<AppSidebarProps> = ({
    navItems = [],
    className,
    ...props
}) => {
    return (
        <Sidebar
            collapsible="icon"
            {...props}
            className={cn(
                "border-r bg-background",
                className
            )}
        >
            <SidebarHeader className="p-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        CV
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">CyVault</span>
                        <span className="text-xs text-muted-foreground">Dashboard</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarNav items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <SidebarFooterComponent />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar
export type { NavItem }

