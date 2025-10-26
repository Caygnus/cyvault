import { NextRequest, NextResponse } from "next/server";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/services/user";

/**
 * GET /api/users - List all users
 */
export async function GET() {
    try {
        await ensureBootstrap();
        const params = getRepoParams();
        const userService = new UserServiceImpl(params);

        try {
            const users = await userService.listUsers();
            return NextResponse.json({
                data: users,
                count: users.length,
            });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error("[GET /api/users] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: NextRequest) {
    try {
        await ensureBootstrap();
        const body = await request.json();
        const { id, name, email, avatarUrl } = body;

        // Basic validation
        if (!id || !name || !email) {
            return NextResponse.json(
                { error: "Missing required fields: id, name, email" },
                { status: 400 }
            );
        }

        const params = getRepoParams();
        const userService = new UserServiceImpl(params);

        try {
            const user = await userService.createUser({
                id,
                name,
                email,
                avatarUrl,
            });

            return NextResponse.json(
                { data: user },
                { status: 201 }
            );
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 409 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error("[POST /api/users] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}