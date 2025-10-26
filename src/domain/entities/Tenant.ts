import { Tenant as TenantDB } from '@/core/db/schema';
import { EntityStatus } from '@/types';
import { BaseEntity } from './BaseEntity';

export class TenantEntity extends BaseEntity {
    constructor(
        id: string,
        public readonly name: string,
        public readonly description: string | null,
        status: EntityStatus,
        createdAt: Date,
        updatedAt: Date,
        createdBy: string | null,
        updatedBy: string | null,
    ) {
        super(id, status, createdAt, updatedAt, createdBy, updatedBy);
    }

    static fromDB(tenant: TenantDB): TenantEntity {
        return new TenantEntity(
            tenant.id,
            tenant.name,
            tenant.description,
            tenant.status as EntityStatus,
            tenant.createdAt,
            tenant.updatedAt,
            tenant.createdBy,
            tenant.updatedBy
        );
    }

    toDB(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Type-safe version that returns the specific TenantDB type
     */
    toTenantDB(): TenantDB {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    copyWith(updates: Partial<BaseEntity>): BaseEntity {
        return new TenantEntity(
            (updates as Partial<TenantEntity>).id ?? this.id,
            (updates as Partial<TenantEntity>).name ?? this.name,
            (updates as Partial<TenantEntity>).description ?? this.description,
            (updates as Partial<TenantEntity>).status ?? this.status,
            (updates as Partial<TenantEntity>).createdAt ?? this.createdAt,
            (updates as Partial<TenantEntity>).updatedAt ?? this.updatedAt,
            (updates as Partial<TenantEntity>).createdBy ?? this.createdBy,
            (updates as Partial<TenantEntity>).updatedBy ?? this.updatedBy,
        );
    }

    /**
     * Type-safe copyWith method that returns TenantEntity
     */
    with(updates: Partial<TenantEntity>): TenantEntity {
        return new TenantEntity(
            updates.id ?? this.id,
            updates.name ?? this.name,
            updates.description ?? this.description,
            updates.status ?? this.status,
            updates.createdAt ?? this.createdAt,
            updates.updatedAt ?? this.updatedAt,
            updates.createdBy ?? this.createdBy,
            updates.updatedBy ?? this.updatedBy,
        );
    }
}
