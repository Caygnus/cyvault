"use client"

import React from "react"
import { MainLayout } from "@/components/layouts"
import type { NavItem } from "@/components/molecules"
import { routes } from "@/config/routes"
import {
    LayoutDashboard,
    Shield,
    FileText,
    Users,
    Star,
    Trash2,
} from "lucide-react"

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        url: routes.dashboard,
        icon: LayoutDashboard,
    },
    {
        title: "Vaults",
        url: routes.vaults,
        icon: Shield,
    },
    {
        title: "Items",
        url: routes.items,
        icon: FileText,
    },
    {
        title: "Shared",
        url: routes.shared,
        icon: Users,
    },
    {
        title: "Favorites",
        url: routes.favorites,
        icon: Star,
    },
    {
        title: "Trash",
        url: routes.trash,
        icon: Trash2,
    },
]

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <MainLayout navItems={navItems}>{children}</MainLayout>
}
