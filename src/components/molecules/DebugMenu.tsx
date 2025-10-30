"use client"

import * as React from "react"

// Placeholder component - customize this based on your needs
const DebugMenu: React.FC = () => {
    const isDev = process.env.NODE_ENV === "development"

    if (!isDev) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Add your debug menu content here */}
            <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg text-xs">
                <div>Debug Menu</div>
            </div>
        </div>
    )
}

export default DebugMenu

