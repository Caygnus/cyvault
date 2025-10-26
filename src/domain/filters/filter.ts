import { and, eq, gte, lte, ne, asc, desc } from 'drizzle-orm';
import { EntityStatus, SortOrder } from '@/types';

// ============================================================================
// BASE FILTER TYPES
// ============================================================================

/**
 * Base filter interface for all entity filters
 */
export interface BaseEntityFilter {
    // Pagination
    limit?: number;
    offset?: number;

    // Status filtering
    status?: EntityStatus;

    // Sorting
    sort?: string;
    order?: SortOrder;

    // Time range
    startTime?: Date;
    endTime?: Date;

    // Pagination helpers
    getLimit(): number;
    getOffset(): number;
    getStatus(): string;
    getSort(): string;
    getOrder(): SortOrder;
    isUnlimited(): boolean;
    validate(): void;
}

// ============================================================================
// BASE FILTER CLASS
// ============================================================================

/**
 * Base filter implementation with common functionality
 */
export abstract class BaseFilter implements BaseEntityFilter {
    limit?: number;
    offset?: number;
    status?: EntityStatus;
    sort?: string;
    order?: SortOrder;
    startTime?: Date;
    endTime?: Date;

    constructor(params: {
        limit?: number;
        offset?: number;
        status?: EntityStatus;
        sort?: string;
        order?: SortOrder;
        startTime?: Date;
        endTime?: Date;
    } = {}) {
        this.limit = params.limit;
        this.offset = params.offset;
        this.status = params.status;
        this.sort = params.sort;
        this.order = params.order;
        this.startTime = params.startTime;
        this.endTime = params.endTime;
    }

    getLimit(): number {
        return this.limit ?? 50;
    }

    getOffset(): number {
        return this.offset ?? 0;
    }

    getStatus(): string {
        return this.status ?? '';
    }

    getSort(): string {
        return this.sort ?? 'created_at';
    }

    getOrder(): SortOrder {
        return this.order ?? SortOrder.DESC;
    }

    isUnlimited(): boolean {
        return !this.limit;
    }

    validate(): void {
        // Validate limit
        if (this.limit && (this.limit < 1 || this.limit > 1000)) {
            throw new Error('Limit must be between 1 and 1000');
        }

        // Validate offset
        if (this.offset && this.offset < 0) {
            throw new Error('Offset must be non-negative');
        }

        // Validate order
        if (this.order && !Object.values(SortOrder).includes(this.order)) {
            throw new Error('Order must be either asc or desc');
        }

        // Validate time range
        if (this.startTime && this.endTime) {
            if (this.endTime <= this.startTime) {
                throw new Error('End time must be after start time');
            }
        }
    }

    /**
     * Build base conditions for any entity
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buildBaseConditions(schema: any): any[] {
        const conditions: any[] = [];

        // Apply status filter
        if (this.getStatus()) {
            if (schema.status) {
                conditions.push(eq(schema.status, this.getStatus()));
            }
        } else if (schema.status) {
            // Default: exclude deleted
            conditions.push(ne(schema.status, EntityStatus.DELETED));
        }

        // Apply time range filters
        if (this.startTime && schema.createdAt) {
            conditions.push(gte(schema.createdAt, this.startTime));
        }
        if (this.endTime && schema.createdAt) {
            conditions.push(lte(schema.createdAt, this.endTime));
        }

        return conditions;
    }

    /**
     * Apply base filters to a query
     * @param query - A drizzle-orm query builder (typed as any for flexibility)
     * @param schema - The table schema object
     * @returns The modified query builder
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyBaseFilters(query: any, schema: any): any {
        // Build conditions
        const conditions = this.buildBaseConditions(schema);

        // Apply conditions
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply sorting
        const sortField = this.getSort() === 'created_at' ? schema.createdAt : schema.name;
        if (sortField) {
            query = query.orderBy(this.getOrder() === SortOrder.ASC ? asc(sortField) : desc(sortField));
        }

        // Apply pagination
        if (!this.isUnlimited()) {
            query = query.limit(this.getLimit()).offset(this.getOffset());
        }

        return query;
    }

    // Factory methods - should be overridden by subclasses
    static createDefault(): BaseFilter {
        throw new Error('createDefault must be implemented by subclass');
    }

    static createNoLimit(): BaseFilter {
        throw new Error('createNoLimit must be implemented by subclass');
    }
}