import { EntityStatus, SortOrder } from '@/types';
import { BaseFilter } from './filter';
import { inArray, like, and } from 'drizzle-orm';
import { users } from '@/core/db/schema';

/**
 * User-specific filter implementation
 */
export class UserFilter extends BaseFilter {
    // User-specific filter fields
    userIds?: string[];
    emails?: string[];
    nameContains?: string;

    constructor(params: {
        limit?: number;
        offset?: number;
        status?: EntityStatus;
        sort?: string;
        order?: SortOrder;
        startTime?: Date;
        endTime?: Date;
        userIds?: string[];
        emails?: string[];
        nameContains?: string;
    } = {}) {
        super(params);
        this.userIds = params.userIds;
        this.emails = params.emails;
        this.nameContains = params.nameContains;
    }

    /**
     * Build conditions array for this filter
     */
    buildConditions(schema: typeof users): any[] {
        const conditions = this.buildBaseConditions(schema);

        // Apply user IDs filter
        if (this.userIds && this.userIds.length > 0 && schema.id) {
            conditions.push(inArray(schema.id, this.userIds));
        }

        // Apply emails filter
        if (this.emails && this.emails.length > 0 && schema.email) {
            conditions.push(inArray(schema.email, this.emails));
        }

        // Apply name contains filter
        if (this.nameContains && schema.name) {
            conditions.push(like(schema.name, `%${this.nameContains}%`));
        }

        return conditions;
    }

    /**
     * Apply all filters to a query
     * @param query - A drizzle-orm select query builder for users table
     * @param schema - The users table schema
     * @returns The modified query builder
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyToQuery(query: any, schema: typeof users): any {
        // Build conditions
        const conditions = this.buildConditions(schema);

        // Apply conditions
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        // Apply base filters (sorting, pagination)
        return this.applyBaseFilters(query, schema);
    }

    // Override factory methods with proper typing
    static createDefault(): UserFilter {
        return new UserFilter({
            limit: 50,
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }

    static createNoLimit(): UserFilter {
        return new UserFilter({
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }
}