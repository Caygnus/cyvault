"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type LucideIcon } from "lucide-react"

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
}

interface SidebarNavProps {
    items: NavItem[]
}

const SidebarNav = React.forwardRef<HTMLDivElement, SidebarNavProps>(
    ({ items, ...props }, ref) => {
        const pathname = usePathname()

        const isActive = (url: string) => {
            if (url === "/") {
                return pathname === url
            }
            return pathname === url || pathname?.startsWith(url + "/")
        }

        return (
            <SidebarGroup ref={ref} {...props}>
                <SidebarMenu>
                    {items.map((item) => {
                        const active = isActive(item.url)
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={active}
                                    className={cn(
                                        "w-full justify-start gap-3 transition-colors duration-200",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        active && "bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                                    )}
                                >
                                    <Link href={item.url}>
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarGroup>
        )
    }
)

SidebarNav.displayName = "SidebarNav"

export default SidebarNav
