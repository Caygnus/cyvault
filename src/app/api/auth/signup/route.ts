import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/core/middleware";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { AuthServiceImpl } from "@/service";
import { SignupRequest } from "@/domain";
import RequestContext from "@/core/context/context";

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