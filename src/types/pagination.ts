/**
 * PaginationResponse represents standardized pagination metadata
 */
export interface PaginationResponse {
    total: number;
    limit: number;
    offset: number;
}

/**
 * ListResponse represents a paginated response with items
 */
export interface ListResponse<T> {
    items: T[];
    pagination: PaginationResponse;
}

/**
 * NewPaginationResponse creates a new pagination response
 */
export function NewPaginationResponse(total: number, limit: number, offset: number): PaginationResponse {
    return {
        total,
        limit,
        offset: offset + limit,
    };
}

/**
 * NewListResponse creates a new list response with pagination
 */
export function NewListResponse<T>(items: T[], total: number, limit: number, offset: number): ListResponse<T> {
    return {
        items,
        pagination: {
            total,
            limit,
            offset,
        },
    };
}
