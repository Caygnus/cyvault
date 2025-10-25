/**
 * Middleware module exports
 * This file provides a clean API for importing middleware functionality
 */

// Main middleware function
export { AuthMiddleware } from './middleware';

// Configuration and types
export { RouteType, UserHeaders, PROTECTED_ROUTES, PROTECTED_API_ROUTES, PUBLIC_ROUTES } from './config';

// Route matching utilities
export {
    isRouteProtected,
    getRouteType,
    isApiRoute,
    isPageRoute,
    isPublicRoute
} from './route-matcher';

// Authentication utilities
export {
    getCurrentUser,
    isUserAuthenticated,
    setUserContext,
    createUnauthorizedResponse,
    createRedirectResponse
} from './auth-utils';

// User context helpers
export { UserContext } from './middleware';

// Logger (for debugging)
export { logger } from './logger';

// Re-export types from Supabase
export type { User, Session } from '@supabase/supabase-js';
