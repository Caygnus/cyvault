import { injectable } from "tsyringe";
import { UserFilter } from '@/domain/filters';
import { users } from '@/db/schema';
import type { Database } from '@/db/client';
import { UserEntity } from '@/domain/entities';
import { eq, and } from 'drizzle-orm';
import type { AppError } from '@/types';
import { Err, withErrorHandling } from '@/types';

// Repository interface following Go pattern with error returns
export interface UserRepository {
    create(user: UserEntity): Promise<{ data: UserEntity, error: AppError | null }>;
    findById(id: string): Promise<{ data: UserEntity | null, error: AppError | null }>;
    findByEmail(email: string): Promise<{ data: UserEntity | null, error: AppError | null }>;
    findAll(filter?: UserFilter): Promise<{ data: UserEntity[], error: AppError | null }>;
    count(filter?: UserFilter): Promise<{ data: number, error: AppError | null }>;
    update(user: UserEntity): Promise<{ data: UserEntity, error: AppError | null }>;
    delete(id: string): Promise<{ data: void, error: AppError | null }>;
    findByIds(ids: string[]): Promise<{ data: UserEntity[], error: AppError | null }>;
}

// Implementation with proper error handling
@injectable()
export class UserRepositoryImpl implements UserRepository {
    constructor(private readonly db: Database) { }

    async create(user: UserEntity): Promise<{ data: UserEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [created] = await this.db.insert(users).values(user.toUserDB()).returning();
                return { data: UserEntity.fromDB(created), error: null };
            } catch (error) {
                throw Err.database('Failed to create user', error as Error)
                    .withDetails({ userId: user.id, email: user.email })
                    .build();
            }
        });
    }

    async findById(id: string): Promise<{ data: UserEntity | null, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [result] = await this.db.select().from(users).where(eq(users.id, id));
                return { data: result ? UserEntity.fromDB(result) : null, error: null };
            } catch (error) {
                throw Err.database('Failed to find user by ID', error as Error)
                    .withDetails({ userId: id })
                    .build();
            }
        });
    }

    async findByEmail(email: string): Promise<{ data: UserEntity | null, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [result] = await this.db.select().from(users).where(eq(users.email, email));
                return { data: result ? UserEntity.fromDB(result) : null, error: null };
            } catch (error) {
                throw Err.database('Failed to find user by email', error as Error)
                    .withDetails({ email })
                    .build();
            }
        });
    }

    async findAll(filter: UserFilter = UserFilter.createDefault()): Promise<{ data: UserEntity[], error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                filter.validate();

                // Start with base query
                let query = this.db.select().from(users);

                // Apply filters using the filter's built-in method
                query = filter.applyToQuery(query, users);

                const results = await query;
                return { data: results.map(UserEntity.fromDB), error: null };
            } catch (error) {
                throw Err.database('Failed to find all users', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async count(filter: UserFilter = UserFilter.createDefault()): Promise<{ data: number, error: AppError | null }> {
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
                return { data: result.length, error: null };
            } catch (error) {
                throw Err.database('Failed to count users', error as Error)
                    .withDetails({ filter: JSON.stringify(filter) })
                    .build();
            }
        });
    }

    async update(user: UserEntity): Promise<{ data: UserEntity, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                const [updated] = await this.db.update(users)
                    .set(user.toUserDB())
                    .where(eq(users.id, user.id))
                    .returning();
                return { data: UserEntity.fromDB(updated), error: null };
            } catch (error) {
                throw Err.database('Failed to update user', error as Error)
                    .withDetails({ userId: user.id })
                    .build();
            }
        });
    }

    async delete(id: string): Promise<{ data: void, error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                await this.db.update(users)
                    .set({ status: 'deleted' })
                    .where(eq(users.id, id));
                return { data: undefined, error: null };
            } catch (error) {
                throw Err.database('Failed to delete user', error as Error)
                    .withDetails({ userId: id })
                    .build();
            }
        });
    }

    async findByIds(ids: string[]): Promise<{ data: UserEntity[], error: AppError | null }> {
        return withErrorHandling(async () => {
            try {
                if (ids.length === 0) return { data: [], error: null };

                const { inArray } = await import('drizzle-orm');
                const results = await this.db.select().from(users).where(inArray(users.id, ids));
                return { data: results.map(UserEntity.fromDB), error: null };
            } catch (error) {
                throw Err.database('Failed to find users by IDs', error as Error)
                    .withDetails({ userIds: ids })
                    .build();
            }
        });
    }
}
