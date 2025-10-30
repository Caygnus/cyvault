import { BaseFilter } from './filter';
import { inArray, like, and } from 'drizzle-orm';
import { EntityStatus, SortOrder } from '@/types';
import { tenants } from '@/db/schema';

/**
 * Tenant-specific filter implementation
 */
export class TenantFilter extends BaseFilter {
    // Tenant-specific filter fields
    tenantIds?: string[];
    nameContains?: string;
    descriptionContains?: string;

    constructor(params: {
        limit?: number;
        offset?: number;
        status?: EntityStatus;
        sort?: string;
        order?: SortOrder;
        startTime?: Date;
        endTime?: Date;
        tenantIds?: string[];
        nameContains?: string;
        descriptionContains?: string;
    } = {}) {
        super(params);
        this.tenantIds = params.tenantIds;
        this.nameContains = params.nameContains;
        this.descriptionContains = params.descriptionContains;
    }

    /**
     * Build conditions array for this filter
     */
    buildConditions(schema: typeof tenants): any[] {
        const conditions = this.buildBaseConditions(schema);

        // Apply tenant IDs filter
        if (this.tenantIds && this.tenantIds.length > 0 && schema.id) {
            conditions.push(inArray(schema.id, this.tenantIds));
        }

        // Apply name contains filter
        if (this.nameContains && schema.name) {
            conditions.push(like(schema.name, `%${this.nameContains}%`));
        }

        // Apply description contains filter
        if (this.descriptionContains && schema.description) {
            conditions.push(like(schema.description, `%${this.descriptionContains}%`));
        }

        return conditions;
    }

    /**
     * Apply all filters to a query
     * @param query - A drizzle-orm select query builder for tenants table
     * @param schema - The tenants table schema
     * @returns The modified query builder
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyToQuery(query: any, schema: typeof tenants): any {
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
    static createDefault(): TenantFilter {
        return new TenantFilter({
            limit: 50,
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }

    static createNoLimit(): TenantFilter {
        return new TenantFilter({
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }
}