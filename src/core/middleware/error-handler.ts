/**
 * Error handling middleware for Next.js API routes
 * Similar to the Go Gin middleware pattern
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    AppError,
    ErrorResponse,
    toErrorResponse,
    toAppError as convertToAppError,
    getStatusCode,
    is,
    logError
} from '@/types';

/**
 * Error handler middleware that wraps API route handlers
 * Similar to the Go Gin ErrorHandler middleware
 */
export function withErrorHandler<T = any>(
    handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
        try {
            const result = await handler(req, ...args);

            // If handler returns a NextResponse, return it directly
            if (result instanceof NextResponse) {
                return result;
            }

            // If handler returns data, wrap it in a success response
            return NextResponse.json({
                success: true,
                data: result
            });
        } catch (error) {
            return handleError(error, req);
        }
    };
}

/**
 * Handle errors and return proper API response
 * Automatically detects error type and handles appropriately
 */
function handleError(error: unknown, req: NextRequest): NextResponse {
    const appError = convertToAppError(error);

    // Log error with request context
    logError(appError, `${req.method} ${req.nextUrl.pathname}`);

    // Auto-detect error type and create appropriate response
    const response = createAppropriateErrorResponse(appError);

    return NextResponse.json(response, { status: response.error.statusCode });
}

/**
 * Extract safe details from error (similar to Go's getSafeDetails)
 */
function getSafeDetails(error: unknown): Record<string, unknown> {
    if (is.appError(error) && error.details) return error.details;

    if (error instanceof Error) {
        // Try to extract JSON details from error message
        const message = error.message;
        const jsonMatch = message.match(/__json__:\s*(.+)/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch {
                // Ignore JSON parsing errors
            }
        }
    }

    return {};
}

/**
 * Automatically detect error type and create appropriate response
 * Follows industry standards for API error responses:
 * - Consistent structure across all error types
 * - Appropriate HTTP status codes
 * - Clear, user-friendly messages (no sensitive data)
 * - Structured details for debugging
 * - Machine-readable error codes
 */
function createAppropriateErrorResponse(appError: AppError): ErrorResponse {
    const { code, statusCode, displayMessage, internalError, details } = appError;

    // Auto-detect error type based on code and message patterns
    const errorType = detectErrorType(appError);
    const isProduction = process.env.NODE_ENV === 'production';

    // Create response based on detected type
    switch (errorType) {
        case 'validation':
            return {
                success: false,
                error: {
                    message: displayMessage || 'Validation failed. Please check your input.',
                    code: code || 'VALIDATION_ERROR',
                    statusCode: 400,
                    // Don't expose internal errors in production
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'not_found':
            return {
                success: false,
                error: {
                    message: displayMessage || 'The requested resource was not found.',
                    code: code || 'NOT_FOUND',
                    statusCode: 404,
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'unauthorized':
            return {
                success: false,
                error: {
                    message: displayMessage || 'Authentication required. Please log in.',
                    code: code || 'UNAUTHORIZED',
                    statusCode: 401,
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'forbidden':
            return {
                success: false,
                error: {
                    message: displayMessage || 'You do not have permission to access this resource.',
                    code: code || 'FORBIDDEN',
                    statusCode: 403,
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'conflict':
            return {
                success: false,
                error: {
                    message: displayMessage || 'The request conflicts with existing data.',
                    code: code || 'CONFLICT',
                    statusCode: 409,
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'database':
            return {
                success: false,
                error: {
                    // Never expose database details to clients
                    message: isProduction
                        ? 'An error occurred while processing your request.'
                        : 'Database operation failed',
                    code: code || 'DATABASE_ERROR',
                    statusCode: 500,
                    internal_error: isProduction ? undefined : (internalError || 'Database error occurred'),
                    details: isProduction ? {} : sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        case 'rate_limit':
            return {
                success: false,
                error: {
                    message: displayMessage || 'Too many requests. Please try again later.',
                    code: code || 'RATE_LIMIT_EXCEEDED',
                    statusCode: 429,
                    internal_error: isProduction ? undefined : internalError,
                    details: sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };

        default:
            // Generic error response - never expose internal server details in production
            return {
                success: false,
                error: {
                    message: isProduction
                        ? 'An unexpected error occurred. Please try again later.'
                        : (displayMessage || 'An unexpected error occurred'),
                    code: code || 'INTERNAL_ERROR',
                    statusCode: statusCode || 500,
                    internal_error: isProduction ? undefined : internalError,
                    details: isProduction ? {} : sanitizeErrorDetails(details || {}),
                    timestamp: appError.timestamp.toISOString(),
                }
            };
    }
}

/**
 * Sanitize error details to prevent sensitive data exposure
 * Industry standard: Never expose passwords, tokens, or internal system details
 */
function sanitizeErrorDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
        'password', 'token', 'secret', 'apiKey', 'api_key',
        'authorization', 'cookie', 'session', 'ssn', 'creditCard',
        'privateKey', 'private_key', 'connectionString', 'connection_string'
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(details)) {
        const lowerKey = key.toLowerCase();

        // Skip sensitive keys
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
            continue;
        }

        // Handle nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeErrorDetails(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Intelligently detect error type based on error properties
 */
function detectErrorType(appError: AppError): string {
    const { code, message, displayMessage, details } = appError;

    // Check error code first
    if (code) {
        if (code.includes('VALIDATION') || code.includes('VALIDATION_ERROR')) return 'validation';
        if (code.includes('NOT_FOUND')) return 'not_found';
        if (code.includes('UNAUTHORIZED') || code.includes('TOKEN')) return 'unauthorized';
        if (code.includes('FORBIDDEN') || code.includes('PERMISSION')) return 'forbidden';
        if (code.includes('CONFLICT')) return 'conflict';
        if (code.includes('DATABASE')) return 'database';
        if (code.includes('RATE_LIMIT')) return 'rate_limit';
    }

    // Check message patterns
    const messageToCheck = displayMessage || message;

    if (messageToCheck) {
        const lowerMessage = messageToCheck.toLowerCase();

        // Validation patterns
        if (lowerMessage.includes('required') ||
            lowerMessage.includes('invalid') ||
            lowerMessage.includes('validation') ||
            lowerMessage.includes('format') ||
            lowerMessage.includes('must be')) {
            return 'validation';
        }

        // Not found patterns
        if (lowerMessage.includes('not found') ||
            lowerMessage.includes('does not exist') ||
            lowerMessage.includes('not exist')) {
            return 'not_found';
        }

        // Authentication patterns
        if (lowerMessage.includes('unauthorized') ||
            lowerMessage.includes('authentication') ||
            lowerMessage.includes('login') ||
            lowerMessage.includes('token')) {
            return 'unauthorized';
        }

        // Authorization patterns
        if (lowerMessage.includes('forbidden') ||
            lowerMessage.includes('permission') ||
            lowerMessage.includes('access denied')) {
            return 'forbidden';
        }

        // Conflict patterns
        if (lowerMessage.includes('already exists') ||
            lowerMessage.includes('duplicate') ||
            lowerMessage.includes('conflict')) {
            return 'conflict';
        }

        // Database patterns
        if (lowerMessage.includes('database') ||
            lowerMessage.includes('connection') ||
            lowerMessage.includes('query') ||
            lowerMessage.includes('constraint')) {
            return 'database';
        }

        // Rate limit patterns
        if (lowerMessage.includes('rate limit') ||
            lowerMessage.includes('too many requests') ||
            lowerMessage.includes('throttle')) {
            return 'rate_limit';
        }
    }

    // Check details for additional context
    if (details) {
        if (details.field || details.validation) return 'validation';
        if (details.resource || details.identifier) return 'not_found';
        if (details.database || details.query) return 'database';
    }

    // Default to internal error
    return 'internal';
}

/**
 * Higher-order function for API route handlers
 * Usage: export const GET = withApiErrorHandler(async (req) => { ... })
 */
export function withApiErrorHandler<T = any>(
    handler: (req: NextRequest, context?: { params: any }) => Promise<T>
) {
    return async (req: NextRequest, context?: { params: any }): Promise<NextResponse> => {
        try {
            const result = await handler(req, context);

            // If handler returns a NextResponse, return it directly
            if (result instanceof NextResponse) {
                return result;
            }

            // If handler returns data, wrap it in a success response
            return NextResponse.json({
                success: true,
                data: result
            });
        } catch (error) {
            return handleError(error, req);
        }
    };
}

/**
 * Middleware for handling errors in API routes with custom error handling
 */
export function withCustomErrorHandler<T = any>(
    handler: (req: NextRequest, ...args: any[]) => Promise<T>,
    errorHandler?: (error: unknown, req: NextRequest) => NextResponse
) {
    return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
        try {
            const result = await handler(req, ...args);

            if (result instanceof NextResponse) {
                return result;
            }

            return NextResponse.json({
                success: true,
                data: result
            });
        } catch (error) {
            if (errorHandler) {
                return errorHandler(error, req);
            }
            return handleError(error, req);
        }
    };
}

/**
 * Utility to create error responses manually
 */
export function createErrorResponse(
    error: unknown,
    statusCode?: number
): NextResponse {
    const response = toErrorResponse(error);
    const code = statusCode || getStatusCode(error);

    return NextResponse.json(response, { status: code });
}

/**
 * Utility to create success responses
 */
export function createSuccessResponse<T>(
    data: T,
    statusCode: number = 200
): NextResponse {
    return NextResponse.json({
        success: true,
        data
    }, { status: statusCode });
}

/**
 * Utility to create validation error responses
 */
export function createValidationErrorResponse(
    message: string,
    details?: Record<string, unknown>
): NextResponse {
    return NextResponse.json({
        success: false,
        error: {
            message,
            code: 'VALIDATION_ERROR',
            statusCode: 400,
            details,
            timestamp: new Date().toISOString(),
        }
    }, { status: 400 });
}

/**
 * Utility to create not found error responses
 */
export function createNotFoundErrorResponse(
    resource: string,
    identifier?: string
): NextResponse {
    const message = identifier
        ? `${resource} with identifier '${identifier}' not found`
        : `${resource} not found`;

    return NextResponse.json({
        success: false,
        error: {
            message,
            code: 'NOT_FOUND',
            statusCode: 404,
            timestamp: new Date().toISOString(),
        }
    }, { status: 404 });
}
