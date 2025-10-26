import { EntityStatus } from '@/types';

/**
 * Base entity class that provides common fields for all entities.
 * All domain entities should extend this class.
 */
export abstract class BaseEntity {
    constructor(
        public readonly id: string,
        public readonly status: EntityStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly createdBy: string | null,
        public readonly updatedBy: string | null,
    ) { }

    /**
     * Converts the entity to a database record.
     * Implementation should be provided by concrete entity classes.
     * 
     * @returns A database record compatible with the entity's DB schema
     */
    abstract toDB(): Record<string, unknown>;

    /**
     * Creates a copy of this entity with the provided fields updated.
     * Implementation should be provided by concrete entity classes.
     */
    abstract copyWith(updates: Partial<BaseEntity>): BaseEntity;
}
