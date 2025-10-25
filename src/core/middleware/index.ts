/**
 * Unified Middleware Service
 * Single interface for all middleware functionality
 */

// Main service class with all methods
export { MiddlewareService } from './middleware';

// Individual method exports for convenience
export {
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
    UserHeaders,
    RouteType,
    PROTECTED_ROUTES,
    PUBLIC_API_ROUTES,
    PUBLIC_ROUTES
} from './middleware';

// Re-export types from Supabase
export type { User, Session } from '@supabase/supabase-js';
