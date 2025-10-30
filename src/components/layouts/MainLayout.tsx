"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar, { NavItem } from "@/components/molecules/Sidebar"
import BreadCrumbs from "@/components/molecules/BreadCrumbs"
import DebugMenu from "@/components/molecules/DebugMenu"

interface MainLayoutProps {
    children: React.ReactNode
    navItems?: NavItem[]
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, navItems = [] }) => {
    return (
        <SidebarProvider className="flex h-screen bg-gray-100 relative font-open-sans">
            {/* Sidebar */}
            <AppSidebar navItems={navItems} />

            {/* Right Layout */}
            <SidebarInset className="flex flex-col flex-1 bg-white h-screen relative">
                <BreadCrumbs />

                {/* Main Content */}
                <main className="flex-1 px-4 relative overflow-y-auto">
                    {children}
                    <DebugMenu />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default MainLayout

