import { Vault as VaultDB } from '@/db/schema';
import { EntityStatus } from '@/types';
import { generateUUIDWithPrefix, UUID_PREFIX } from '@/core/utils/uuid';
import { BaseEntity } from './base';

export interface VaultEntityParams {
    id?: string;
    name: string;
    description?: string | null;
    iconUrl?: string | null;
    color?: string | null;
    metadata?: Record<string, string> | null;
    userId: string;
    tenantId: string;
    status?: EntityStatus;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export class VaultEntity extends BaseEntity {
    constructor(
        id: string,
        public readonly name: string,
        public readonly description: string | null,
        public readonly iconUrl: string | null,
        public readonly color: string | null,
        public readonly metadata: Record<string, string> | null,
        public readonly userId: string,
        public readonly tenantId: string,
        status: EntityStatus,
        createdAt: Date,
        updatedAt: Date,
        createdBy: string | null,
        updatedBy: string | null,
    ) {
        super(id, status, createdAt, updatedAt, createdBy, updatedBy);
    }

    static fromDB(vault: VaultDB): VaultEntity {
        return new VaultEntity(
            vault.id,
            vault.name,
            vault.description,
            vault.iconUrl,
            vault.color,
            vault.metadata || null,
            vault.userId,
            vault.tenantId,
            vault.status as EntityStatus,
            vault.createdAt,
            vault.updatedAt,
            vault.createdBy,
            vault.updatedBy
        );
    }

    toDB(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            iconUrl: this.iconUrl,
            color: this.color,
            metadata: this.metadata || {},
            userId: this.userId,
            tenantId: this.tenantId,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Type-safe version that returns the specific VaultDB type
     */
    toVaultDB(): VaultDB {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            iconUrl: this.iconUrl,
            color: this.color,
            metadata: this.metadata || {},
            userId: this.userId,
            tenantId: this.tenantId,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    copyWith(updates: Partial<BaseEntity>): BaseEntity {
        return new VaultEntity(
            (updates as Partial<VaultEntity>).id ?? this.id,
            (updates as Partial<VaultEntity>).name ?? this.name,
            (updates as Partial<VaultEntity>).description ?? this.description,
            (updates as Partial<VaultEntity>).iconUrl ?? this.iconUrl,
            (updates as Partial<VaultEntity>).color ?? this.color,
            (updates as Partial<VaultEntity>).metadata ?? this.metadata,
            (updates as Partial<VaultEntity>).userId ?? this.userId,
            (updates as Partial<VaultEntity>).tenantId ?? this.tenantId,
            (updates as Partial<VaultEntity>).status ?? this.status,
            (updates as Partial<VaultEntity>).createdAt ?? this.createdAt,
            (updates as Partial<VaultEntity>).updatedAt ?? this.updatedAt,
            (updates as Partial<VaultEntity>).createdBy ?? this.createdBy,
            (updates as Partial<VaultEntity>).updatedBy ?? this.updatedBy,
        );
    }

    /**
     * Type-safe copyWith method that returns VaultEntity
     */
    with(updates: Partial<VaultEntity>): VaultEntity {
        return new VaultEntity(
            updates.id ?? this.id,
            updates.name ?? this.name,
            updates.description ?? this.description,
            updates.iconUrl ?? this.iconUrl,
            updates.color ?? this.color,
            updates.metadata ?? this.metadata,
            updates.userId ?? this.userId,
            updates.tenantId ?? this.tenantId,
            updates.status ?? this.status,
            updates.createdAt ?? this.createdAt,
            updates.updatedAt ?? this.updatedAt,
            updates.createdBy ?? this.createdBy,
            updates.updatedBy ?? this.updatedBy,
        );
    }

    /**
     * Creates a new VaultEntity instance from an object of parameters
     */
    static create(params: VaultEntityParams): VaultEntity {
        const now = new Date();
        return new VaultEntity(
            params.id ?? generateUUIDWithPrefix(UUID_PREFIX.VAULT),
            params.name,
            params.description ?? null,
            params.iconUrl ?? null,
            params.color ?? null,
            params.metadata ?? null,
            params.userId,
            params.tenantId,
            params.status ?? EntityStatus.PUBLISHED,
            params.createdAt ?? now,
            params.updatedAt ?? now,
            params.createdBy ?? null,
            params.updatedBy ?? null,
        );
    }
}

