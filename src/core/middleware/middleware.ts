import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

/**
 * Route types for authentication
 */
export enum RouteType {
    PAGE = 'page',
    API = 'api'
}

/**
 * Authentication status
 */
export enum AuthStatus {
    AUTHENTICATED = 'authenticated',
    UNAUTHENTICATED = 'unauthenticated'
}

/**
 * Response headers for user context
 */
export enum UserHeaders {
    USER_ID = 'x-user-id',
    USER_EMAIL = 'x-user-email',
    TENANT_ID = 'x-tenant-id'
}

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin'
];

/**
 * Protected API routes that require authentication
 */
const PROTECTED_API_ROUTES = [
    '/api/protected',
    '/api/user',
    '/api/admin'
];

/**
 * Check if a route requires authentication
 */
function isRouteProtected(pathname: string): boolean {
    return PROTECTED_ROUTES.some(route => matchesRoute(pathname, route)) ||
        PROTECTED_API_ROUTES.some(route => matchesRoute(pathname, route));
}

/**
 * Check if a pathname matches a route pattern (supports wildcards)
 */
function matchesRoute(pathname: string, route: string): boolean {
    // Handle wildcard patterns
    if (route === '*') return true;
    if (route.endsWith('*')) {
        const prefix = route.slice(0, -1);
        return pathname.startsWith(prefix);
    }

    // Handle exact matches
    if (route === pathname) return true;

    // Handle prefix matches (e.g., '/dashboard' matches '/dashboard/settings')
    return pathname.startsWith(route + '/');
}

/**
 * Check if request is for an API route
 */
function isApiRoute(pathname: string): boolean {
    return pathname.startsWith('/api/');
}

/**
 * Check if request is for a page route
 */
function isPageRoute(pathname: string): boolean {
    return !isApiRoute(pathname);
}

/**
 * Get user from Supabase session
 */
async function getCurrentUser(request: NextRequest) {
    const supabase = createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set() {
                    // No-op for middleware
                },
                remove() {
                    // No-op for middleware
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/**
 * Extract tenant ID from user metadata
 */
function getCurrentTenantId(user: User | null): string | null {
    if (!user) return null;
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    return userMetadata.tenant_id || appMetadata.tenant_id || null;
}

/**
 * Set user context in request headers
 */
function setUserContext(request: NextRequest, user: User): void {
    if (!user) return;

    request.headers.set(UserHeaders.USER_ID, user.id || '');
    request.headers.set(UserHeaders.USER_EMAIL, user.email || '');

    const tenantId = getCurrentTenantId(user);
    if (tenantId) {
        request.headers.set(UserHeaders.TENANT_ID, tenantId);
    }
}

/**
 * Authentication middleware
 */
export async function AuthMiddleware(request: NextRequest): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;

    // 1. Check if route needs authentication
    if (!isRouteProtected(pathname)) {
        return NextResponse.next();
    }

    // 2. Get current user
    const user = await getCurrentUser(request);

    // 3. Check if user is authenticated
    if (!user || !user.id) {
        // 4. Check if request is for page or API
        if (isPageRoute(pathname)) {
            // 5. Redirect to login page
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        } else {
            // 6. Return 401 for API
            return new NextResponse(
                JSON.stringify({ error: 'Unauthorized' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }

    // 7. Allow request and attach user context to request
    setUserContext(request, user);
    return NextResponse.next();
}

/**
 * Helper methods for getting user context
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
    }
};
