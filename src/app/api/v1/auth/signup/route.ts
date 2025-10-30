import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { AuthServiceImpl } from "@/service";
import { SignupRequest } from "@/domain";
import RequestContext from "@/core/context/context";

// signupHandler handles the creation of a new user account
// @Summary Sign up a new user
// @Description Creates a new user account with email verification token and optional tenant
// @Tags Authentication
// @Accept json
// @Produce json
// @Param body body SignupRequest true "User signup details"
// @Success 201 {object} SignupResponse
// @Failure 400 {object} ErrorResponse
// @Failure 409 {object} ErrorResponse
// @Router /api/v1/auth/signup [post]
async function signupHandler(request: NextRequest) {
    await ensureBootstrap();
    console.log("Current user ID from context:", RequestContext.tryGetUserId());
    const signupRequest = await SignupRequest.fromRequest(request);
    const params = getRepoParams();
    const authService = new AuthServiceImpl(params);
    const response = await authService.signup(signupRequest);
    return NextResponse.json(response.toJson(), { status: 201 });
}

export const POST = withApiHandler(signupHandler);