import { NextRequest, NextResponse } from "next/server";
import { withApiErrorHandler } from "@/core/middleware/error-handler";
import { ensureBootstrap, getRepoParams } from "@/core/di";
import { AuthServiceImpl } from "@/service";
import { SignupRequest } from "@/domain";

/**
 * POST /api/auth/signup - Complete user registration after Supabase auth
 * 
 * This endpoint should be called AFTER the user has signed up via Supabase Auth
 * (using supabase.auth.signUp() on the frontend). It creates the user record
 * in the application database and handles onboarding.
 * 
 * Request body:
 * - email: string (required) - User email (must match Supabase user)
 * - tenant_name?: string (optional) - Tenant name
 * - name?: string (optional) - User name
 * 
 * Response:
 * - 201: Success with user ID and email
 * - 400: Validation error
 * - 401: No authenticated user found
 * - 409: User already exists
 * - 500: Internal server error
 */
async function signupHandler(request: NextRequest) {
    await ensureBootstrap();

    const signupRequest = await SignupRequest.fromRequest(request);

    const params = getRepoParams();

    const authService = new AuthServiceImpl(params);

    const response = await authService.signup(signupRequest);

    return NextResponse.json(response.toJson(), { status: 201 });
}

export const POST = withApiErrorHandler(signupHandler);