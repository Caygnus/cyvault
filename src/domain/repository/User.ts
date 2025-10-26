import { UserFilter } from '@/domain/filters';
import { users } from '@/core/db/schema';
import { Database } from '@/core/db/client';
import { UserEntity } from '@/domain/entities';
import { eq, and } from 'drizzle-orm';
import { AppError, Err, withErrorHandling } from '@/types';

// Repository interface following Go pattern with error returns
export interface UserRepository {
    create(user: UserEntity): Promise<[UserEntity | null, AppError | null]>;
    findById(id: string): Promise<[UserEntity | null, AppError | null]>;
    findByEmail(email: string): Promise<[UserEntity | null, AppError | null]>;
    findAll(filter?: UserFilter): Promise<[UserEntity[], AppError | null]>;
    count(filter?: UserFilter): Promise<[number, AppError | null]>;
    update(user: UserEntity): Promise<[UserEntity | null, AppError | null]>;
    delete(id: string): Promise<[void, AppError | null]>;
    findByIds(ids: string[]): Promise<[UserEntity[], AppError | null]>;
}

// Implementation with proper error handling
export class UserRepositoryImpl implements UserRepository {
    constructor(private readonly db: Database) { }

    async create(user: UserEntity): Promise<[UserEntity | null, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                const [created] = await this.db.insert(users).values(user.toUserDB()).returning();
                return [UserEntity.fromDB(created), null] as const;
            } catch (error) {
                throw Err.database('Failed to create user', error as Error)
                    .withDetails({ userId: user.id, email: user.email })
                    .build();
            }
        });
    }

    async findById(id: string): Promise<[UserEntity | null, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                const [result] = await this.db.select().from(users).where(eq(users.id, id));
                return [result ? UserEntity.fromDB(result) : null, null] as const;
            } catch (error) {
                throw Err.database('Failed to find user by ID', error as Error)
                    .withDetails({ userId: id })
                    .build();
            }
        });
    }

    async findByEmail(email: string): Promise<[UserEntity | null, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                const [result] = await this.db.select().from(users).where(eq(users.email, email));
                return [result ? UserEntity.fromDB(result) : null, null] as const;
            } catch (error) {
                throw Err.database('Failed to find user by email', error as Error)
                    .withDetails({ email })
                    .build();
            }
        });
    }

    async findAll(filter: UserFilter = UserFilter.createDefault()): Promise<[UserEntity[], AppError | null]> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Start with base query
                let query = this.db.select().from(users);

                // Apply filters using the filter's built-in method
                query = filter.applyToQuery(query, users);

                const results = await query;
                return [results.map(UserEntity.fromDB), null] as const;
            } catch (error) {
                throw Err.database('Failed to find all users', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async count(filter: UserFilter = UserFilter.createDefault()): Promise<[number, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Build conditions using the filter's buildConditions method
                const conditions = filter.buildConditions(users);

                let query = this.db.select().from(users);

                if (conditions.length > 0) {
                    query = query.where(and(...conditions)) as typeof query;
                }

                const result = await query;
                return [result.length, null] as const;
            } catch (error) {
                throw Err.database('Failed to count users', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async update(user: UserEntity): Promise<[UserEntity | null, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                const [updated] = await this.db.update(users)
                    .set(user.toUserDB())
                    .where(eq(users.id, user.id))
                    .returning();
                return [UserEntity.fromDB(updated), null] as const;
            } catch (error) {
                throw Err.database('Failed to update user', error as Error)
                    .withDetails({ userId: user.id })
                    .build();
            }
        });
    }

    async delete(id: string): Promise<[void, AppError | null]> {
        return withErrorHandling(async () => {
            try {
                await this.db.update(users)
                    .set({ status: 'deleted' })
                    .where(eq(users.id, id));
                return [undefined, null] as const;
            } catch (error) {
                throw Err.database('Failed to delete user', error as Error)
                    .withDetails({ userId: id })
                    .build();
            }
        });
    }

    async findByIds(ids: string[]): Promise<[UserEntity[], AppError | null]> {
        return withErrorHandling(async () => {
            try {
                if (ids.length === 0) return [[], null] as const;

                const { inArray } = await import('drizzle-orm');
                const results = await this.db.select().from(users).where(inArray(users.id, ids));
                return [results.map(UserEntity.fromDB), null] as const;
            } catch (error) {
                throw Err.database('Failed to find users by IDs', error as Error)
                    .withDetails({ userIds: ids })
                    .build();
            }
        });
    }
}

// Legacy interface for backward compatibility (can be removed later)
export interface UserRepositoryFilter {
    create(user: UserEntity): Promise<UserEntity>;
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(filter?: UserFilter): Promise<UserEntity[]>;
    count(filter?: UserFilter): Promise<number>;
    update(user: UserEntity): Promise<UserEntity>;
    delete(id: string): Promise<void>;
    findByIds(ids: string[]): Promise<UserEntity[]>;
}

export class UserRepositoryFilterImpl implements UserRepositoryFilter {
    constructor(private readonly db: Database) { }

    async create(user: UserEntity): Promise<UserEntity> {
        const [result, error] = await new UserRepositoryImpl(this.db).create(user);
        if (error) throw error;
        return result!;
    }

    async findById(id: string): Promise<UserEntity | null> {
        const [result, error] = await new UserRepositoryImpl(this.db).findById(id);
        if (error) throw error;
        return result;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const [result, error] = await new UserRepositoryImpl(this.db).findByEmail(email);
        if (error) throw error;
        return result;
    }

    async findAll(filter: UserFilter = UserFilter.createDefault()): Promise<UserEntity[]> {
        const [result, error] = await new UserRepositoryImpl(this.db).findAll(filter);
        if (error) throw error;
        return result;
    }

    async count(filter: UserFilter = UserFilter.createDefault()): Promise<number> {
        const [result, error] = await new UserRepositoryImpl(this.db).count(filter);
        if (error) throw error;
        return result;
    }

    async update(user: UserEntity): Promise<UserEntity> {
        const [result, error] = await new UserRepositoryImpl(this.db).update(user);
        if (error) throw error;
        return result!;
    }

    async delete(id: string): Promise<void> {
        const [, error] = await new UserRepositoryImpl(this.db).delete(id);
        if (error) throw error;
    }

    async findByIds(ids: string[]): Promise<UserEntity[]> {
        const [result, error] = await new UserRepositoryImpl(this.db).findByIds(ids);
        if (error) throw error;
        return result;
    }
}