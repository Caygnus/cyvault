import { injectable } from "tsyringe";
import { VaultFilter } from '@/domain/filters';
import { vaults } from '@/db/schema';
import type { Database } from '@/db/client';
import { VaultEntity } from '@/domain/entities';
import { eq, and } from 'drizzle-orm';
import type { AppError } from '@/types';
import { Err, withErrorHandling } from '@/types';
import RequestContext from '@/core/context/context';

// Repository interface following Go pattern with error returns
export interface VaultRepository {
    create(vault: VaultEntity): Promise<{ data: VaultEntity, error: AppError | null }>;
    findById(id: string): Promise<{ data: VaultEntity | null, error: AppError | null }>;
    findAll(filter?: VaultFilter): Promise<{ data: VaultEntity[], error: AppError | null }>;
    count(filter?: VaultFilter): Promise<{ data: number, error: AppError | null }>;
    update(vault: VaultEntity): Promise<{ data: VaultEntity, error: AppError | null }>;
    delete(id: string): Promise<{ data: void, error: AppError | null }>;
}

// Implementation with proper error handling
@injectable()
export class VaultRepositoryImpl implements VaultRepository {
    constructor(private readonly db: Database) { }

    /**
     * Helper method to get tenant ID from context and ensure it exists
     */
    private getTenantIdFromContext(): string {
        try {
            const tenantId = RequestContext.getTenantId();
            console.log('[VaultRepository] getTenantIdFromContext - tenantId:', tenantId);
            return tenantId;
        } catch (error) {
            console.error('[VaultRepository] Failed to get tenant ID from context:', error);
            console.error('[VaultRepository] Has context:', RequestContext.hasContext());
            console.error('[VaultRepository] Try get tenant ID:', RequestContext.tryGetTenantId());
            throw Err.unauthorized('Tenant ID is required for vault operations')
                .build();
        }
    }

    /**
     * Helper method to get tenant ID condition
     */
    private getTenantCondition() {
        const tenantId = this.getTenantIdFromContext();
        return eq(vaults.tenantId, tenantId);
    }

    /**
     * Helper method to get user ID from context (optional - only used for user-scoped queries)
     */
    private tryGetUserIdFromContext(): string | null {
        try {
            return RequestContext.getUserId();
        } catch {
            return null;
        }
    }

    /**
     * Helper method to get user ID condition (returns null if no user ID in context)
     */
    private getUserCondition() {
        const userId = this.tryGetUserIdFromContext();
        if (!userId) return null;
        return eq(vaults.createdBy, userId);
    }

    async create(vault: VaultEntity): Promise<{ data: VaultEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [created] = await this.db.insert(vaults).values(vault.toVaultDB()).returning();
                return { data: VaultEntity.fromDB(created), error: null };
            } catch (error) {
                throw Err.database('Failed to create vault', error as Error)
                    .withDetails({ vaultId: vault.id, name: vault.name })
                    .build();
            }
        });
    }

    async findById(id: string): Promise<{ data: VaultEntity | null, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const tenantId = this.getTenantIdFromContext();
                const conditions = [eq(vaults.id, id), eq(vaults.tenantId, tenantId)];

                // Always add user ID condition if user is in context (cannot be overridden)
                const userCondition = this.getUserCondition();
                if (userCondition) {
                    conditions.push(userCondition);
                }

                const [result] = await this.db.select()
                    .from(vaults)
                    .where(and(...conditions));
                return { data: result ? VaultEntity.fromDB(result) : null, error: null };
            } catch (error) {
                throw Err.database('Failed to find vault by ID', error as Error)
                    .withDetails({ vaultId: id })
                    .build();
            }
        });
    }

    async findAll(filter: VaultFilter = VaultFilter.createDefault()): Promise<{ data: VaultEntity[], error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                console.log('[VaultRepository] findAll - hasContext:', RequestContext.hasContext());
                console.log('[VaultRepository] findAll - tryGetTenantId:', RequestContext.tryGetTenantId());

                filter.validate();

                // Build conditions from filter
                const conditions = filter.buildConditions(vaults);

                // Always add tenant ID condition (cannot be overridden)
                const tenantCondition = this.getTenantCondition();
                console.log('[VaultRepository] findAll - tenantCondition:', tenantCondition);
                const allConditions = [...conditions, tenantCondition];

                // Always add user ID condition if user is in context (cannot be overridden)
                const userCondition = this.getUserCondition();
                if (userCondition) {
                    allConditions.push(userCondition);
                }

                // Start with base query
                let query = this.db.select().from(vaults);

                // Apply conditions
                query = query.where(and(...allConditions)) as typeof query;

                // Apply sorting and pagination from filter
                query = filter.applyBaseFilters(query, vaults) as typeof query;

                console.log('[VaultRepository] findAll - executing query');
                const results = await query;
                console.log('[VaultRepository] findAll - results count:', results.length);
                return { data: results.map(VaultEntity.fromDB), error: null };
            } catch (error) {
                console.error('[VaultRepository] findAll - error:', error);
                throw Err.database('Failed to find all vaults', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async count(filter: VaultFilter = VaultFilter.createDefault()): Promise<{ data: number, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Build conditions using the filter's buildConditions method
                const conditions = filter.buildConditions(vaults);

                // Always add tenant ID condition (cannot be overridden)
                const tenantCondition = this.getTenantCondition();
                const allConditions = [...conditions, tenantCondition];

                // Always add user ID condition if user is in context (cannot be overridden)
                const userCondition = this.getUserCondition();
                if (userCondition) {
                    allConditions.push(userCondition);
                }

                let query = this.db.select().from(vaults);

                query = query.where(and(...allConditions)) as typeof query;

                const result = await query;
                return { data: result.length, error: null };
            } catch (error) {
                throw Err.database('Failed to count vaults', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async update(vault: VaultEntity): Promise<{ data: VaultEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const tenantId = this.getTenantIdFromContext();
                // Ensure the vault belongs to the current tenant
                if (vault.tenantId !== tenantId) {
                    throw Err.forbidden('Vault does not belong to the current tenant')
                        .withDetails({ vaultId: vault.id, vaultTenantId: vault.tenantId, currentTenantId: tenantId })
                        .build();
                }

                const [updated] = await this.db.update(vaults)
                    .set(vault.toVaultDB())
                    .where(and(eq(vaults.id, vault.id), eq(vaults.tenantId, tenantId)))
                    .returning();
                return { data: VaultEntity.fromDB(updated), error: null };
            } catch (error) {
                throw Err.database('Failed to update vault', error as Error)
                    .withDetails({ vaultId: vault.id })
                    .build();
            }
        });
    }

    async delete(id: string): Promise<{ data: void, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const tenantId = this.getTenantIdFromContext();
                await this.db.update(vaults)
                    .set({ status: 'deleted' })
                    .where(and(eq(vaults.id, id), eq(vaults.tenantId, tenantId)));
                return { data: undefined, error: null };
            } catch (error) {
                throw Err.database('Failed to delete vault', error as Error)
                    .withDetails({ vaultId: id })
                    .build();
            }
        });
    }
}

