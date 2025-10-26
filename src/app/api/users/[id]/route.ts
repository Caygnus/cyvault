import { NextRequest, NextResponse } from "next/server";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { Err, ErrorCode, toErrorResponse } from "@/types";
import { UserServiceImpl } from "@/services/user";

type RouteParams = {
    params: Promise<{ id: string }>;
};

/**
 * GET /api/users/[id] - Get a single user by ID
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        await ensureBootstrap();
        const { id } = await params;
        const repoParams = getRepoParams();
        const userService = new UserServiceImpl(repoParams);

        const user = await userService.getUserById(id);

        if (!user) {
            return NextResponse.json(toErrorResponse(Err.notFound("User", id).withCode(ErrorCode.NOT_FOUND).build()));
        }

        return NextResponse.json({ data: user });
    } catch (error) {
        console.error(`[GET /api/users/${(await params).id}] Error:`, error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/users/[id] - Update a user
 */
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        await ensureBootstrap();
        const { id } = await params;
        const body = await request.json();
        const repoParams = getRepoParams();
        const userService = new UserServiceImpl(repoParams);

        try {
            const user = await userService.updateUser(id, body);
            return NextResponse.json({ data: user });
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error(`[PATCH /api/users/${(await params).id}] Error:`, error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/users/[id] - Soft delete a user
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        await ensureBootstrap();
        const { id } = await params;
        const repoParams = getRepoParams();
        const userService = new UserServiceImpl(repoParams);

        try {
            await userService.deleteUser(id);
            return NextResponse.json(
                { message: "User deleted successfully" },
                { status: 200 }
            );
        } catch (error) {
            if (error instanceof Error) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 404 }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error(`[DELETE /api/users/${(await params).id}] Error:`, error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}