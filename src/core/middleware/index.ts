export { MiddlewareService } from './middleware';

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
    PUBLIC_API_ROUTES,
    PUBLIC_ROUTES
} from './middleware';

export {
    withErrorHandler,
    withApiErrorHandler,
    withCustomErrorHandler,
    createErrorResponse,
    createSuccessResponse,
    createValidationErrorResponse,
    createNotFoundErrorResponse
} from './error-handler';

export type { User, Session } from '@supabase/supabase-js';
