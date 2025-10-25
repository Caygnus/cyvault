import { NextRequest, NextResponse } from 'next/server';

// Import optimized modules
import { RouteType, UserHeaders } from './config';
import { isRouteProtected, getRouteType } from './route-matcher';
import {
    getCurrentUser,
    setUserContext,
    createUnauthorizedResponse,
    createRedirectResponse,
    isUserAuthenticated
} from './auth-utils';
import { logger } from './logger';

/**
 * Authentication middleware - Optimized version
 */
export async function AuthMiddleware(request: NextRequest): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;

    logger.info(pathname);

    try {
        // 1. Early return for non-protected routes
        if (!isRouteProtected(pathname)) {
            logger.info(pathname);
            return NextResponse.next();
        }

        logger.info(pathname);

        // 2. Get current user with optimized error handling
        const { user, response } = await getCurrentUser(request);
        logger.info(`User found: ${user ? user.id : 'not found'}`);

        // 3. Check authentication status
        if (!isUserAuthenticated(user)) {
            logger.info('User not authenticated');
            return handleUnauthenticatedRequest(request, pathname);
        }

        // 4. User is authenticated - set context and proceed
        logger.info(`User authenticated: ${user!.id}`);
        return setUserContext(request, user!);

    } catch (error) {
        logger.error(error as string);
        return NextResponse.next();
    }
}

/**
 * Handle unauthenticated requests based on route type
 */
function handleUnauthenticatedRequest(request: NextRequest, pathname: string): NextResponse {
    const routeType = getRouteType(pathname);

    if (routeType === RouteType.PAGE) {
        logger.info('Redirecting to login');
        return createRedirectResponse(request, pathname);
    } else {
        logger.info('Returning unauthorized');
        return createUnauthorizedResponse();
    }
}

/**
 * Helper methods for getting user context from request headers
 * These methods can be used in API routes and Server Components
 */
export const UserContext = {
    /**
     * Get current user ID from request headers
     */
    getCurrentUserId(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.USER_ID);
    },

    /**
     * Get current tenant ID from request headers
     */
    getCurrentTenantId(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.TENANT_ID);
    },

    /**
     * Get current user email from request headers
     */
    getCurrentUserEmail(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.USER_EMAIL);
    },

    /**
     * Get all user context from request headers
     */
    getAllUserContext(request: NextRequest): {
        userId: string | null;
        email: string | null;
        tenantId: string | null;
    } {
        return {
            userId: this.getCurrentUserId(request),
            email: this.getCurrentUserEmail(request),
            tenantId: this.getCurrentTenantId(request),
        };
    },

    /**
     * Check if user context is available in request headers
     */
    hasUserContext(request: NextRequest): boolean {
        return !!(this.getCurrentUserId(request) && this.getCurrentUserEmail(request));
    }
};

// Re-export types and utilities for convenience
export { RouteType, UserHeaders } from './config';
export { isRouteProtected, getRouteType } from './route-matcher';
export { getCurrentUser, isUserAuthenticated } from './auth-utils';
