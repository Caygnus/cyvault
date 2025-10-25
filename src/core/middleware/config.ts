/**
 * Middleware configuration and constants
 */

/**
 * Route types for authentication
 */
export enum RouteType {
    PAGE = 'page',
    API = 'api'
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
export const PROTECTED_ROUTES = [
    '/',
    '/dashboard',
    '/profile',
    '/settings',
    '/admin'
] as const;

/**
 * Protected API routes that require authentication
 */
export const PROTECTED_API_ROUTES = [
    '/api/protected',
    '/api/user',
    '/api/admin',
    '/api/test'
] as const;

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/_next',
    '/favicon.ico',
    '/api/auth'
] as const;

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
    API: /^\/api\//,
    STATIC: /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/,
    NEXT_INTERNAL: /^\/_next\//,
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
    USER_SESSION_TTL: 5 * 60 * 1000, // 5 minutes
    ROUTE_CACHE_TTL: 60 * 1000, // 1 minute
} as const;

/**
 * Logging configuration
 */
export const LOG_CONFIG = {
    ENABLED: process.env.NODE_ENV === 'development',
    LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
} as const;
