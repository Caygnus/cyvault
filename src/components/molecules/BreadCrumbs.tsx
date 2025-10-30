"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface Breadcrumb {
    label: string
    path: string
    isLoading?: boolean
}

interface BreadCrumbsProps {
    breadcrumbs?: Breadcrumb[]
    isLoading?: boolean
}

const BreadCrumbs: React.FC<BreadCrumbsProps> = ({
    breadcrumbs = [],
    isLoading = false,
}) => {
    const pathname = usePathname()

    const generatedBreadcrumbs = React.useMemo(() => {
        if (breadcrumbs.length > 0) return breadcrumbs

        // Generate breadcrumbs from pathname if not provided
        const segments = pathname?.split("/").filter(Boolean) || []
        return segments.map((segment, index) => ({
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            path: "/" + segments.slice(0, index + 1).join("/"),
            isLoading: false,
        }))
    }, [breadcrumbs, pathname])

    if (isLoading) {
        return (
            <header className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="px-6 py-4">
                    <div className="h-6 animate-pulse bg-gray-200 rounded w-48"></div>
                </div>
            </header>
        )
    }

    return (
        <header className="bg-white sticky top-0 z-10 shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
                {/* Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2 mr-2">
                        <SidebarTrigger className="text-gray-800" />
                        <div className="h-5 w-[1px] border-r border-gray-200"></div>
                    </div>

                    {generatedBreadcrumbs.map((breadcrumb, index) => (
                        <span key={index} className="flex items-center space-x-2">
                            {breadcrumb.isLoading ? (
                                <div className="h-5 w-20 animate-pulse bg-gray-200 rounded"></div>
                            ) : index === generatedBreadcrumbs.length - 1 ||
                                index === 0 ? (
                                <div
                                    className={`hover:text-gray-800 capitalize select-none ${index === generatedBreadcrumbs.length - 1
                                        ? "font-normal text-[#020617]"
                                        : ""
                                        }`}
                                >
                                    {breadcrumb.label}
                                </div>
                            ) : (
                                <Link
                                    href={breadcrumb.path}
                                    className={`hover:text-gray-800 capitalize ${index === generatedBreadcrumbs.length - 1
                                        ? "font-normal text-[#020617]"
                                        : ""
                                        }`}
                                >
                                    {breadcrumb.label}
                                </Link>
                            )}
                            {index < generatedBreadcrumbs.length - 1 && (
                                <span>
                                    <ChevronRight className="w-4 h-4" />
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            </div>
        </header>
    )
}

export default BreadCrumbs

