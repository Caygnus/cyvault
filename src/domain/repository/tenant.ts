import { injectable } from "tsyringe";
import { TenantFilter } from '@/domain/filters';
import { tenants } from '@/core/db/schema';
import type { Database } from '@/core/db/client';
import { TenantEntity } from '@/domain/entities';
import { eq, and } from 'drizzle-orm';
import type { AppError } from '@/types';
import { Err, withErrorHandling } from '@/types';

// Repository interface following Go pattern with error returns
export interface TenantRepository {
    create(tenant: TenantEntity): Promise<{ data: TenantEntity, error: AppError | null }>;
    findById(id: string): Promise<{ data: TenantEntity | null, error: AppError | null }>;
    findAll(filter?: TenantFilter): Promise<{ data: TenantEntity[], error: AppError | null }>;
    count(filter?: TenantFilter): Promise<{ data: number, error: AppError | null }>;
    update(tenant: TenantEntity): Promise<{ data: TenantEntity, error: AppError | null }>;
    delete(id: string): Promise<{ data: void, error: AppError | null }>;
    findByIds(ids: string[]): Promise<{ data: TenantEntity[], error: AppError | null }>;
}

// Implementation with proper error handling
@injectable()
export class TenantRepositoryImpl implements TenantRepository {
    constructor(private readonly db: Database) { }

    async create(tenant: TenantEntity): Promise<{ data: TenantEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [created] = await this.db.insert(tenants).values(tenant.toTenantDB()).returning();
                return { data: TenantEntity.fromDB(created), error: null };
            } catch (error) {
                throw Err.database('Failed to create tenant', error as Error)
                    .withDetails({ tenantId: tenant.id, name: tenant.name })
                    .build();
            }
        });
    }

    async findById(id: string): Promise<{ data: TenantEntity | null, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [result] = await this.db.select().from(tenants).where(eq(tenants.id, id));
                return { data: result ? TenantEntity.fromDB(result) : null, error: null };
            } catch (error) {
                throw Err.database('Failed to find tenant by ID', error as Error)
                    .withDetails({ tenantId: id })
                    .build();
            }
        });
    }

    async findAll(filter: TenantFilter = TenantFilter.createDefault()): Promise<{ data: TenantEntity[], error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Start with base query
                let query = this.db.select().from(tenants);

                // Apply filters using the filter's built-in method
                query = filter.applyToQuery(query, tenants);

                const results = await query;
                return { data: results.map(TenantEntity.fromDB), error: null };
            } catch (error) {
                throw Err.database('Failed to find all tenants', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async count(filter: TenantFilter = TenantFilter.createDefault()): Promise<{ data: number, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Build conditions using the filter's buildConditions method
                const conditions = filter.buildConditions(tenants);

                let query = this.db.select().from(tenants);

                if (conditions.length > 0) {
                    query = query.where(and(...conditions)) as typeof query;
                }

                const result = await query;
                return { data: result.length, error: null };
            } catch (error) {
                throw Err.database('Failed to count tenants', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async update(tenant: TenantEntity): Promise<{ data: TenantEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [updated] = await this.db.update(tenants)
                    .set(tenant.toTenantDB())
                    .where(eq(tenants.id, tenant.id))
                    .returning();
                return { data: TenantEntity.fromDB(updated), error: null };
            } catch (error) {
                throw Err.database('Failed to update tenant', error as Error)
                    .withDetails({ tenantId: tenant.id })
                    .build();
            }
        });
    }

    async delete(id: string): Promise<{ data: void, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                await this.db.update(tenants)
                    .set({ status: 'deleted' })
                    .where(eq(tenants.id, id));
                return { data: undefined, error: null };
            } catch (error) {
                throw Err.database('Failed to delete tenant', error as Error)
                    .withDetails({ tenantId: id })
                    .build();
            }
        });
    }

    async findByIds(ids: string[]): Promise<{ data: TenantEntity[], error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                if (ids.length === 0) return { data: [], error: null };

                const { inArray } = await import('drizzle-orm');
                const results = await this.db.select().from(tenants).where(inArray(tenants.id, ids));
                return { data: results.map(TenantEntity.fromDB), error: null };
            } catch (error) {
                throw Err.database('Failed to find tenants by IDs', error as Error)
                    .withDetails({ tenantIds: ids })
                    .build();
            }
        });
    }
}
