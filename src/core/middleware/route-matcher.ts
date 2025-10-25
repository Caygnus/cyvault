import { RouteType, PROTECTED_ROUTES, PROTECTED_API_ROUTES, PUBLIC_ROUTES, ROUTE_PATTERNS } from './config';

/**
 * Route matching utilities for middleware
 */

/**
 * Check if a pathname matches a route pattern (supports wildcards)
 */
export function matchesRoute(pathname: string, route: string): boolean {
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
export function isApiRoute(pathname: string): boolean {
    return ROUTE_PATTERNS.API.test(pathname);
}

/**
 * Check if request is for a page route
 */
export function isPageRoute(pathname: string): boolean {
    return !isApiRoute(pathname);
}

/**
 * Get the route type for proper response handling
 */
export function getRouteType(pathname: string): RouteType {
    return isApiRoute(pathname) ? RouteType.API : RouteType.PAGE;
}

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => matchesRoute(pathname, route)) ||
        ROUTE_PATTERNS.STATIC.test(pathname) ||
        ROUTE_PATTERNS.NEXT_INTERNAL.test(pathname);
}

/**
 * Check if a route requires authentication
 */
export function isRouteProtected(pathname: string): boolean {
    // Skip if it's a public route
    if (isPublicRoute(pathname)) {
        return false;
    }

    // Check protected routes
    return PROTECTED_ROUTES.some(route => matchesRoute(pathname, route)) ||
        PROTECTED_API_ROUTES.some(route => matchesRoute(pathname, route));
}