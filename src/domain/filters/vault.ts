import { EntityStatus, SortOrder } from '@/types';
import { BaseFilter } from './filter';
import { inArray, like, and, eq } from 'drizzle-orm';
import { vaults } from '@/db/schema';

/**
 * Vault-specific filter implementation
 */
export class VaultFilter extends BaseFilter {
    // Vault-specific filter fields
    vaultIds?: string[];
    nameContains?: string;
    descriptionContains?: string;
    color?: string;

    constructor(params: {
        limit?: number;
        offset?: number;
        status?: EntityStatus;
        sort?: string;
        order?: SortOrder;
        startTime?: Date;
        endTime?: Date;
        vaultIds?: string[];
        nameContains?: string;
        descriptionContains?: string;
        color?: string;
    } = {}) {
        super(params);
        this.vaultIds = params.vaultIds;
        this.nameContains = params.nameContains;
        this.descriptionContains = params.descriptionContains;
        this.color = params.color;
    }

    /**
     * Build conditions array for this filter
     */
    buildConditions(schema: typeof vaults): any[] {
        const conditions = this.buildBaseConditions(schema);

        // Apply vault IDs filter
        if (this.vaultIds && this.vaultIds.length > 0 && schema.id) {
            conditions.push(inArray(schema.id, this.vaultIds));
        }

        // Apply name contains filter
        if (this.nameContains && schema.name) {
            conditions.push(like(schema.name, `%${this.nameContains}%`));
        }

        // Apply description contains filter
        if (this.descriptionContains && schema.description) {
            conditions.push(like(schema.description, `%${this.descriptionContains}%`));
        }

        // Apply color filter
        if (this.color && schema.color) {
            conditions.push(eq(schema.color, this.color));
        }

        return conditions;
    }

    /**
     * Apply all filters to a query
     * @param query - A drizzle-orm select query builder for vaults table
     * @param schema - The vaults table schema
     * @returns The modified query builder
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyToQuery(query: any, schema: typeof vaults): any {
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
    static createDefault(): VaultFilter {
        return new VaultFilter({
            limit: 50,
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }

    static createNoLimit(): VaultFilter {
        return new VaultFilter({
            offset: 0,
            sort: 'created_at',
            order: SortOrder.DESC,
        });
    }
}

