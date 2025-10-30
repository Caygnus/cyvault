import React from "react"

const Page = () => {
    return (
        <div className="py-8">
            <h1 className="text-3xl font-bold mb-4">Welcome to CyVault</h1>
            <p className="text-gray-600">
                Your main content goes here. The layout includes:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
                <li>Collapsible sidebar with navigation</li>
                <li>Breadcrumb navigation</li>
                <li>Responsive design</li>
                <li>Debug menu (in development mode)</li>
            </ul>
        </div>
    )
}

export default Page
