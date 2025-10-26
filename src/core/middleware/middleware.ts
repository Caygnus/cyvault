import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import RequestContext, { RequestContextStore } from '@/core/context/context';
import {
    toErrorResponse,
    toAppError,
    getStatusCode,
    logError,
    ErrorCode
} from '@/types';

export enum UserHeaders {
    USER_ID = 'x-user-id',
    USER_EMAIL = 'x-user-email',
    TENANT_ID = 'x-tenant-id'
}

export enum RouteType {
    PAGE = 'page',
    API = 'api'
}

export const PUBLIC_API_ROUTES = [
    '/api/health',
    '/api/auth/signup',
    '/api/auth/login',
] as const;

export const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
] as const;

const ROUTE_PATTERNS = {
    API: /^\/api\//,
    STATIC: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
    NEXT_INTERNAL: /^\/_next\//,
} as const;

type CookieData = {
    name: string;
    value: string;
    options?: Record<string, unknown>;
};

export type RouteHandler<T = unknown> = (req: NextRequest, ...args: unknown[]) => Promise<T>;

export type ApiRouteHandler<T = unknown> = (req: NextRequest, context?: { params: unknown }) => Promise<T>;

export class MiddlewareService {
    static async handleRequest(request: NextRequest): Promise<NextResponse> {
        const pathname = request.nextUrl.pathname;

        try {
            if (!this.isRouteProtected(pathname)) {
                return NextResponse.next();
            }

            const { user } = await this.getCurrentUser(request);

            if (!this.isUserAuthenticated(user)) {
                return this.handleUnauthenticatedRequest(request, pathname);
            }

            return this.setUserContext(request, user!);

        } catch {
            return NextResponse.next();
        }
    }

    private static async getCurrentUser(request: NextRequest): Promise<{ user: User | null; response: NextResponse }> {
        try {
            const response = NextResponse.next({
                request: {
                    headers: request.headers,
                },
            });

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseAnonKey) {
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
                        } catch {
                            // Silent fail for cookie setting
                        }
                    },
                },
            });

            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) {
                return { user: null, response };
            }

            return { user, response };
        } catch {
            return { user: null, response: NextResponse.next() };
        }
    }

    private static setUserContext(request: NextRequest, user: User): NextResponse {
        if (!user) return NextResponse.next();

        const response = NextResponse.next({
            request: {
                headers: request.headers,
            },
        });

        request.headers.set(UserHeaders.USER_ID, user.id || '');
        request.headers.set(UserHeaders.USER_EMAIL, user.email || '');

        const tenantId = this.extractTenantIdFromUser(user);
        if (tenantId) {
            request.headers.set(UserHeaders.TENANT_ID, tenantId);
        }

        response.headers.set(UserHeaders.USER_ID, user.id || '');
        response.headers.set(UserHeaders.USER_EMAIL, user.email || '');
        if (tenantId) {
            response.headers.set(UserHeaders.TENANT_ID, tenantId);
        }

        this.initializeRequestContext(request, user, tenantId);

        return response;
    }

    private static initializeRequestContext(request: NextRequest, user: User, tenantId: string | null): void {
        try {
            const contextStore: RequestContextStore = {
                requestId: crypto.randomUUID(),
                requestPath: request.nextUrl.pathname,
                requestMethod: request.method,
                requestStartTime: Date.now(),
                [UserHeaders.USER_ID]: user.id,
                [UserHeaders.USER_EMAIL]: user.email || '',
            };

            if (tenantId) {
                contextStore[UserHeaders.TENANT_ID] = tenantId;
            }

            RequestContext.run(contextStore, () => { });
        } catch (error) {
            console.error('Failed to initialize RequestContext:', error);
        }
    }

    private static handleUnauthenticatedRequest(request: NextRequest, pathname: string): NextResponse {
        const routeType = this.getRouteType(pathname);

        if (routeType === RouteType.PAGE) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        } else {
            return new NextResponse(
                JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Authentication required',
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
    }

    private static extractTenantIdFromUser(user: User | null): string | null {
        if (!user) return null;
        const userMetadata = user.user_metadata || {};
        const appMetadata = user.app_metadata || {};
        return userMetadata.tenant_id || appMetadata.tenant_id || null;
    }

    static isUserAuthenticated(user: User | null): boolean {
        return !!(user && user.id);
    }

    private static matchesRoute(pathname: string, route: string): boolean {
        if (route === '*') return true;
        if (route.endsWith('*')) {
            const prefix = route.slice(0, -1);
            return pathname.startsWith(prefix);
        }
        if (route === pathname) return true;
        return pathname.startsWith(route + '/');
    }

    static isApiRoute(pathname: string): boolean {
        return ROUTE_PATTERNS.API.test(pathname);
    }

    static isPageRoute(pathname: string): boolean {
        return !this.isApiRoute(pathname);
    }

    static getRouteType(pathname: string): string {
        return this.isApiRoute(pathname) ? RouteType.API : RouteType.PAGE;
    }

    static isPublicRoute(pathname: string): boolean {
        return PUBLIC_ROUTES.some(route => this.matchesRoute(pathname, route)) ||
            PUBLIC_API_ROUTES.some(route => this.matchesRoute(pathname, route)) ||
            ROUTE_PATTERNS.STATIC.test(pathname) ||
            ROUTE_PATTERNS.NEXT_INTERNAL.test(pathname);
    }

    static isRouteProtected(pathname: string): boolean {
        return !this.isPublicRoute(pathname);
    }

    static getCurrentUserId(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.USER_ID);
    }

    static getCurrentTenantId(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.TENANT_ID);
    }

    static getCurrentUserEmail(request: NextRequest): string | null {
        return request.headers.get(UserHeaders.USER_EMAIL);
    }

    static isAuthenticated(request: NextRequest): boolean {
        return this.getCurrentUserId(request) !== null;
    }

    static hasTenantContext(request: NextRequest): boolean {
        return this.getCurrentTenantId(request) !== null;
    }

    static hasUserContext(request: NextRequest): boolean {
        return !!(this.getCurrentUserId(request) && this.getCurrentUserEmail(request));
    }

    static getUserContext(request: NextRequest) {
        return {
            userId: this.getCurrentUserId(request),
            userEmail: this.getCurrentUserEmail(request),
            tenantId: this.getCurrentTenantId(request),
            isAuthenticated: this.isAuthenticated(request),
            hasTenantContext: this.hasTenantContext(request)
        };
    }

    static getAllUserContext(request: NextRequest) {
        return {
            userId: this.getCurrentUserId(request),
            email: this.getCurrentUserEmail(request),
            tenantId: this.getCurrentTenantId(request),
        };
    }

    static handleError(error: unknown, req: NextRequest): NextResponse {
        const appError = toAppError(error);
        const errorResponse = toErrorResponse(appError);
        const statusCode = getStatusCode(appError);

        const isValidationError = appError.code === ErrorCode.VALIDATION_ERROR;
        const isNotFoundError = appError.code === ErrorCode.NOT_FOUND;

        if (!isValidationError && !isNotFoundError) {
            logError(appError, `${req.nextUrl.pathname} [${req.method}] [User: ${RequestContext.tryGetUserId() || 'anonymous'}]`);
        }

        return NextResponse.json(errorResponse, { status: statusCode });
    }

    static withHandler<T = unknown>(
        handler: RouteHandler<T>
    ): (req: NextRequest, ...args: unknown[]) => Promise<NextResponse> {
        return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
            try {
                // Initialize RequestContext from headers set by middleware
                const result = await RequestContext.fromRequest(req, async () => {
                    return await handler(req, ...args);
                });

                if (result instanceof NextResponse) {
                    return result;
                }

                return NextResponse.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return MiddlewareService.handleError(error, req);
            }
        };
    }

    static withApiHandler<T = unknown>(
        handler: ApiRouteHandler<T>
    ): (req: NextRequest, context?: { params: unknown }) => Promise<NextResponse> {
        return async (req: NextRequest, context?: { params: unknown }): Promise<NextResponse> => {
            try {
                // Initialize RequestContext from headers set by middleware
                const result = await RequestContext.fromRequest(req, async () => {
                    return await handler(req, context);
                });

                if (result instanceof NextResponse) {
                    return result;
                }

                return NextResponse.json({
                    success: true,
                    data: result
                });
            } catch (error) {
                return MiddlewareService.handleError(error, req);
            }
        };
    }
}

export const {
    isAuthenticated,
    getCurrentUserId,
    getCurrentTenantId,
    getCurrentUserEmail,
    hasTenantContext,
    hasUserContext,
    getUserContext,
    getAllUserContext,
    isApiRoute,
    isPageRoute,
    isPublicRoute,
    isRouteProtected,
    getRouteType,
    withHandler,
    withApiHandler
} = MiddlewareService;