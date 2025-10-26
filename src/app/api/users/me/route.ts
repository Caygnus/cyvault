import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/service";
import RequestContext from "@/core/context/context";

async function getCurrentUserHandler(_request: NextRequest) {
    await ensureBootstrap();
    console.log("Using context from middleware. User ID:", RequestContext.tryGetUserId());
    const params = getRepoParams();
    const userService = new UserServiceImpl(params);
    const currentUser = await userService.getCurrentUser();
    return currentUser;
}

export const GET = withApiHandler(getCurrentUserHandler);