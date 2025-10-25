import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { UserHeaders } from './config';
import { AUTH_ERRORS } from '../supabase/types';

/**
 * Authentication utilities for middleware
 */

/**
 * Cookie type for Supabase
 */
type CookieData = {
    name: string;
    value: string;
    options?: Record<string, unknown>;
};

/**
 * Get user from Supabase session in middleware context
 */
export async function getCurrentUser(request: NextRequest): Promise<{ user: User | null; response: NextResponse }> {
    try {
        // Create a response object to handle cookies properly
        const response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error('❌ Missing Supabase environment variables');
            return { user: null, response: NextResponse.next() };
        }

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: CookieData[]) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value);
                            response.cookies.set(name, value, options);
                        });
                    } catch (error) {
                        console.warn('⚠️ Failed to set cookies in middleware:', error);
                    }
                },
            },
        });

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error('❌ Supabase user error:', userError);
            return { user: null, response };
        }

        return { user, response };
    } catch (error) {
        console.error('❌ Error in getCurrentUser:', error);
        return { user: null, response: NextResponse.next() };
    }
}

/**
 * Extract tenant ID from user metadata
 */
export function getCurrentTenantId(user: User | null): string | null {
    if (!user) return null;
    const userMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};
    return userMetadata.tenant_id || appMetadata.tenant_id || null;
}

/**
 * Set user context in request headers
 */
export function setUserContext(request: NextRequest, user: User): NextResponse {
    if (!user) return NextResponse.next();

    // Create a response that forwards the request with user headers
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Set user context in the forwarded request headers
    request.headers.set(UserHeaders.USER_ID, user.id || '');
    request.headers.set(UserHeaders.USER_EMAIL, user.email || '');

    const tenantId = getCurrentTenantId(user);
    if (tenantId) {
        request.headers.set(UserHeaders.TENANT_ID, tenantId);
    }

    // Also set the headers in the response so they're available in API routes
    response.headers.set(UserHeaders.USER_ID, user.id || '');
    response.headers.set(UserHeaders.USER_EMAIL, user.email || '');
    if (tenantId) {
        response.headers.set(UserHeaders.TENANT_ID, tenantId);
    }

    return response;
}

/**
 * Create unauthorized response for API routes
 */
export function createUnauthorizedResponse(): NextResponse {
    return new NextResponse(
        JSON.stringify({
            error: AUTH_ERRORS.UNAUTHORIZED,
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString()
        }),
        {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        }
    );
}

/**
 * Create redirect response for page routes
 */
export function createRedirectResponse(request: NextRequest, pathname: string): NextResponse {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(user: User | null): boolean {
    return !!(user && user.id);
}
