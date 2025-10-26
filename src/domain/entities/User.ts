import { User as UserDB } from '@/core/db/schema';
import { EntityStatus } from '@/types';
import { generateUUIDWithPrefix, UUID_PREFIX } from '@/core/utils/uuid';
import { BaseEntity } from './base';

export interface UserEntityParams {
    id?: string;
    tenantId?: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    status?: EntityStatus;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export class UserEntity extends BaseEntity {
    constructor(
        id: string, // Supabase UUID
        public readonly tenantId: string,
        public readonly name: string,
        public readonly email: string,
        public readonly avatarUrl: string | null,
        status: EntityStatus,
        createdAt: Date,
        updatedAt: Date,
        createdBy: string | null,
        updatedBy: string | null,
    ) {
        super(id, status, createdAt, updatedAt, createdBy, updatedBy);
    }

    static fromDB(user: UserDB): UserEntity {
        return new UserEntity(
            user.id,
            user.tenantId,
            user.name,
            user.email,
            user.avatarUrl,
            user.status as EntityStatus,
            user.createdAt,
            user.updatedAt,
            user.createdBy,
            user.updatedBy
        );
    }
    toDB(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            avatarUrl: this.avatarUrl,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Type-safe version that returns the specific UserDB type
     */
    toUserDB(): UserDB {
        return {
            id: this.id,
            tenantId: this.tenantId,
            name: this.name,
            email: this.email,
            avatarUrl: this.avatarUrl,
            status: this.status,
            createdBy: this.createdBy,
            updatedBy: this.updatedBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    copyWith(updates: Partial<BaseEntity>): BaseEntity {
        return new UserEntity(
            (updates as Partial<UserEntity>).id ?? this.id,
            (updates as Partial<UserEntity>).tenantId ?? this.tenantId,
            (updates as Partial<UserEntity>).name ?? this.name,
            (updates as Partial<UserEntity>).email ?? this.email,
            (updates as Partial<UserEntity>).avatarUrl ?? this.avatarUrl,
            (updates as Partial<UserEntity>).status ?? this.status,
            (updates as Partial<UserEntity>).createdAt ?? this.createdAt,
            (updates as Partial<UserEntity>).updatedAt ?? this.updatedAt,
            (updates as Partial<UserEntity>).createdBy ?? this.createdBy,
            (updates as Partial<UserEntity>).updatedBy ?? this.updatedBy,
        );
    }

    /**
     * Type-safe copyWith method that returns UserEntity
     */
    with(updates: Partial<UserEntity>): UserEntity {
        return new UserEntity(
            updates.id ?? this.id,
            updates.tenantId ?? this.tenantId,
            updates.name ?? this.name,
            updates.email ?? this.email,
            updates.avatarUrl ?? this.avatarUrl,
            updates.status ?? this.status,
            updates.createdAt ?? this.createdAt,
            updates.updatedAt ?? this.updatedAt,
            updates.createdBy ?? this.createdBy,
            updates.updatedBy ?? this.updatedBy,
        );
    }

    /**
     * Creates a new UserEntity instance from an object of parameters
     */
    static create(params: UserEntityParams): UserEntity {
        const now = new Date();
        return new UserEntity(
            params.id ?? generateUUIDWithPrefix(UUID_PREFIX.USER),
            params.tenantId ?? "",
            params.name,
            params.email,
            params.avatarUrl ?? null,
            params.status ?? EntityStatus.PUBLISHED,
            params.createdAt ?? now,
            params.updatedAt ?? now,
            params.createdBy ?? null,
            params.updatedBy ?? null,
        );
    }
}
