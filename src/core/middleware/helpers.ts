import { NextRequest } from 'next/server';
import { UserContext } from './middleware';

/**
 * Helper functions for API routes and pages
 */

/**
 * Get current user ID from request
 */
export function getCurrentUserId(request: NextRequest): string | null {
    return UserContext.getCurrentUserId(request);
}

/**
 * Get current tenant ID from request
 */
export function getCurrentTenantId(request: NextRequest): string | null {
    return UserContext.getCurrentTenantId(request);
}

/**
 * Get current user email from request
 */
export function getCurrentUserEmail(request: NextRequest): string | null {
    return UserContext.getCurrentUserEmail(request);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
    return getCurrentUserId(request) !== null;
}

/**
 * Check if user has tenant context
 */
export function hasTenantContext(request: NextRequest): boolean {
    return getCurrentTenantId(request) !== null;
}

/**
 * Get user context object
 */
export function getUserContext(request: NextRequest) {
    return {
        userId: getCurrentUserId(request),
        userEmail: getCurrentUserEmail(request),
        tenantId: getCurrentTenantId(request),
        isAuthenticated: isAuthenticated(request),
        hasTenantContext: hasTenantContext(request)
    };
}
