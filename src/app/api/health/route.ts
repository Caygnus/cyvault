import "reflect-metadata";
import { NextResponse } from "next/server";
import { ensureBootstrap } from "@/core/di";

/**
 * Health check endpoint
 */
export async function GET() {
    try {
        // Ensure bootstrap runs once per cold start
        await ensureBootstrap();

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            di_initialized: true,
        });
    } catch (error) {
        console.error("[Health] Error:", error);
        return NextResponse.json(
            {
                status: "unhealthy",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}