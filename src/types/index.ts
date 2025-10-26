// Base types
export { EntityStatus, SortOrder } from "./base";

// Pagination
export type { PaginationResponse, ListResponse } from "./pagination";
export { NewPaginationResponse, NewListResponse } from "./pagination";

// Error handling (consolidated exports)
export {
    // Types
    type AppError,
    type ErrorResponse,
    ErrorCode,

    // Classes
    CustomError,
    ErrorBuilder,

    // Factories
    Err,

    // Type Guards
    is,

    // Utilities
    toAppError,
    toErrorResponse,
    getDisplayMessage,
    getStatusCode,
    getErrorCode,
    withErrorHandling,
    logError,
} from "./errors";
