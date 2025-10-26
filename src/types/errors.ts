/**
 * Core error types and classes
 * Production-grade error handling with fluent builder interface
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly displayMessage: string;
    readonly internalError?: string;
    readonly details?: Record<string, unknown>;
    readonly timestamp: Date;
}

export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        statusCode: number;
        internal_error?: string;
        details?: Record<string, unknown>;
        timestamp: string;
    };
}

// ============================================================================
// ERROR CODES & STATUS MAPPING
// ============================================================================

export enum ErrorCode {
    // General
    INTERNAL_ERROR = "INTERNAL_ERROR",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    NOT_FOUND = "NOT_FOUND",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    CONFLICT = "CONFLICT",
    BAD_REQUEST = "BAD_REQUEST",

    // Database
    DATABASE_ERROR = "DATABASE_ERROR",
    DATABASE_CONNECTION_ERROR = "DATABASE_CONNECTION_ERROR",
    DATABASE_QUERY_ERROR = "DATABASE_QUERY_ERROR",
    DATABASE_CONSTRAINT_ERROR = "DATABASE_CONSTRAINT_ERROR",

    // User
    USER_NOT_FOUND = "USER_NOT_FOUND",
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
    USER_INVALID_CREDENTIALS = "USER_INVALID_CREDENTIALS",
    USER_ACCOUNT_DISABLED = "USER_ACCOUNT_DISABLED",

    // Tenant
    TENANT_NOT_FOUND = "TENANT_NOT_FOUND",
    TENANT_ALREADY_EXISTS = "TENANT_ALREADY_EXISTS",
    TENANT_ACCESS_DENIED = "TENANT_ACCESS_DENIED",

    // Auth
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
}

const STATUS_CODES: Record<ErrorCode, number> = {
    [ErrorCode.INTERNAL_ERROR]: 500,
    [ErrorCode.VALIDATION_ERROR]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.UNAUTHORIZED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.CONFLICT]: 409,
    [ErrorCode.BAD_REQUEST]: 400,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.DATABASE_CONNECTION_ERROR]: 503,
    [ErrorCode.DATABASE_QUERY_ERROR]: 500,
    [ErrorCode.DATABASE_CONSTRAINT_ERROR]: 409,
    [ErrorCode.USER_NOT_FOUND]: 404,
    [ErrorCode.USER_ALREADY_EXISTS]: 409,
    [ErrorCode.USER_INVALID_CREDENTIALS]: 401,
    [ErrorCode.USER_ACCOUNT_DISABLED]: 403,
    [ErrorCode.TENANT_NOT_FOUND]: 404,
    [ErrorCode.TENANT_ALREADY_EXISTS]: 409,
    [ErrorCode.TENANT_ACCESS_DENIED]: 403,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.TOKEN_INVALID]: 401,
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
};

// ============================================================================
// CUSTOM ERROR CLASS
// ============================================================================

export class CustomError extends Error implements AppError {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly displayMessage: string;
    public readonly internalError?: string;
    public readonly details?: Record<string, unknown>;
    public readonly timestamp: Date;

    constructor(
        code: ErrorCode,
        displayMessage: string,
        internalError?: string,
        details?: Record<string, unknown>
    ) {
        super(displayMessage);
        this.name = "CustomError";
        this.code = code;
        this.statusCode = STATUS_CODES[code];
        this.displayMessage = displayMessage;
        this.internalError = internalError;
        this.details = details;
        this.timestamp = new Date();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
    }

    toResponse(): ErrorResponse {
        return {
            success: false,
            error: {
                message: this.displayMessage,
                code: this.code,
                statusCode: this.statusCode,
                internal_error: this.internalError,
                details: this.details,
                timestamp: this.timestamp.toISOString(),
            },
        };
    }
}

// ============================================================================
// ERROR BUILDER (Fluent Interface)
// ============================================================================

export class ErrorBuilder {
    private code: ErrorCode;
    private displayMessage: string;
    private internalError?: string;
    private details?: Record<string, unknown>;
    private cause?: Error;

    private constructor(code: ErrorCode, displayMessage: string) {
        this.code = code;
        this.displayMessage = displayMessage;
    }

    static new(code: ErrorCode, message: string): ErrorBuilder {
        return new ErrorBuilder(code, message);
    }

    static wrap(error: Error): ErrorBuilder {
        return new ErrorBuilder(ErrorCode.INTERNAL_ERROR, error.message).withCause(
            error
        );
    }

    withMessage(message: string): this {
        this.internalError = message;
        return this;
    }

    withHint(hint: string): this {
        this.displayMessage = hint;
        return this;
    }

    withDetails(details: Record<string, unknown>): this {
        this.details = { ...this.details, ...details };
        return this;
    }

    withCode(code: ErrorCode): this {
        this.code = code;
        return this;
    }

    withCause(cause: Error): this {
        this.cause = cause;
        return this;
    }

    build(): CustomError {
        const error = new CustomError(
            this.code,
            this.displayMessage,
            this.internalError,
            this.details
        );

        if (this.cause) {
            error.stack = `${error.stack}\nCaused by: ${this.cause.stack}`;
        }

        return error;
    }

    throw(): never {
        throw this.build();
    }
}

// ============================================================================
// ERROR FACTORY (Common Patterns)
// ============================================================================

export const Err = {
    validation: (message: string, details?: Record<string, unknown>) =>
        ErrorBuilder.new(ErrorCode.VALIDATION_ERROR, message).withDetails(
            details || {}
        ),

    notFound: (resource: string, id?: string) =>
        ErrorBuilder.new(
            ErrorCode.NOT_FOUND,
            id ? `${resource} '${id}' not found` : `${resource} not found`
        ),

    unauthorized: (message = "Unauthorized access") =>
        ErrorBuilder.new(ErrorCode.UNAUTHORIZED, message),

    forbidden: (message = "Access forbidden") =>
        ErrorBuilder.new(ErrorCode.FORBIDDEN, message),

    conflict: (message: string, details?: Record<string, unknown>) =>
        ErrorBuilder.new(ErrorCode.CONFLICT, message).withDetails(details || {}),

    database: (message: string, cause?: Error) =>
        ErrorBuilder.new(ErrorCode.DATABASE_ERROR, message).withCause(
            cause || new Error(message)
        ),

    internal: (message = "Internal server error", cause?: Error) =>
        ErrorBuilder.new(ErrorCode.INTERNAL_ERROR, message).withCause(
            cause || new Error(message)
        ),
};

// ============================================================================
// TYPE GUARDS & UTILITIES
// ============================================================================

export const is = {
    customError: (error: unknown): error is CustomError =>
        error instanceof CustomError,

    appError: (error: unknown): error is AppError =>
        error instanceof CustomError ||
        (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            "statusCode" in error &&
            "displayMessage" in error),

    clientError: (error: unknown): boolean => {
        const code = getStatusCode(error);
        return code >= 400 && code < 500;
    },

    serverError: (error: unknown): boolean => {
        const code = getStatusCode(error);
        return code >= 500 && code < 600;
    },
};

// ============================================================================
// ERROR EXTRACTION UTILITIES
// ============================================================================

export function toAppError(error: unknown): AppError {
    if (is.appError(error)) return error;
    if (error instanceof Error) return ErrorBuilder.wrap(error).build();
    const msg = typeof error === "string" ? error : "Unknown error occurred";
    return ErrorBuilder.new(ErrorCode.INTERNAL_ERROR, msg).build();
}

export function toErrorResponse(error: unknown): ErrorResponse {
    const appError = toAppError(error);
    return is.customError(appError)
        ? appError.toResponse()
        : {
            success: false,
            error: {
                message: appError.displayMessage,
                code: appError.code,
                statusCode: appError.statusCode,
                internal_error: appError.internalError,
                details: appError.details,
                timestamp: appError.timestamp.toISOString(),
            },
        };
}

export function getDisplayMessage(error: unknown): string {
    if (is.appError(error)) return error.displayMessage;
    if (error instanceof Error) return error.message;
    return "An unexpected error occurred";
}

export function getStatusCode(error: unknown): number {
    return is.appError(error) ? error.statusCode : 500;
}

export function getErrorCode(error: unknown): string {
    return is.appError(error) ? error.code : "UNKNOWN_ERROR";
}

// ============================================================================
// ERROR HANDLING WRAPPERS
// ============================================================================

export async function withErrorHandling<T>(
    fn: () => Promise<T>
): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        throw toAppError(error);
    }
}

export function logError(error: unknown, context?: string): void {
    const appError = toAppError(error);
    const prefix = context ? `[${context}]` : "";
    const logData = {
        code: appError.code,
        statusCode: appError.statusCode,
        message: appError.internalError || appError.displayMessage,
        details: appError.details,
        stack: appError.stack,
    };

    if (is.serverError(appError)) {
        console.error(`${prefix} Server Error:`, logData);
    } else if (is.clientError(appError)) {
        console.warn(`${prefix} Client Error:`, logData);
    } else {
        console.error(`${prefix} Unknown Error:`, logData);
    }
}
