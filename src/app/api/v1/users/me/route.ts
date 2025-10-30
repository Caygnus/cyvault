import "reflect-metadata";
import { NextRequest } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { UserServiceImpl } from "@/service";
import RequestContext from "@/core/context/context";

// getCurrentUserHandler returns the profile information of the currently authenticated user
// @Summary Get current authenticated user
// @Description Returns the profile information of the currently authenticated user
// @Tags Users
// @Security bearerAuth
// @Produce json
// @Success 200 {object} UserResponse
// @Failure 401 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Router /api/v1/users/me [get]
async function getCurrentUserHandler(_request: NextRequest) {
    await ensureBootstrap();
    console.log("Using context from middleware. User ID:", RequestContext.tryGetUserId());
    const params = getRepoParams();
    const userService = new UserServiceImpl(params);
    const currentUser = await userService.getCurrentUser();
    return currentUser;
}

export const GET = withApiHandler(getCurrentUserHandler);