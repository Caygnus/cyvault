"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings } from "lucide-react"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { routes } from "@/config/routes"

const SidebarFooter: React.FC = () => {
    const pathname = usePathname()
    const isSettingsActive = pathname === routes.settings

    return (
        <div className="mt-auto border-t">
            <SidebarMenu className="p-2">
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        isActive={isSettingsActive}
                        className={cn(
                            "w-full justify-start gap-3 transition-colors duration-200",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSettingsActive && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                        )}
                    >
                        <Link href={routes.settings}>
                            <Settings className="h-5 w-5" />
                            <span>Settings</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        asChild
                        className="w-full justify-start gap-3 transition-colors duration-200 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                        <Link href={routes.logout}>
                            <LogOut className="h-5 w-5" />
                            <span>Logout</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
    )
}

export default SidebarFooter
