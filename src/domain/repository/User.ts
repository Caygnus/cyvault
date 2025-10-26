import { UserFilter } from '@/domain/filters';
import { users } from '@/core/db/schema';
import { Database } from '@/core/db/client';
import { UserEntity } from '@/domain/entities';
import { eq, and } from 'drizzle-orm';

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
        const [created] = await this.db.insert(users).values(user.toUserDB()).returning();
        return UserEntity.fromDB(created);
    }

    async findById(id: string): Promise<UserEntity | null> {
        const [result] = await this.db.select().from(users).where(eq(users.id, id));
        return result ? UserEntity.fromDB(result) : null;
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        const [result] = await this.db.select().from(users).where(eq(users.email, email));
        return result ? UserEntity.fromDB(result) : null;
    }

    async findAll(filter: UserFilter = UserFilter.createDefault()): Promise<UserEntity[]> {
        filter.validate();

        // Start with base query
        let query = this.db.select().from(users);

        // Apply filters using the filter's built-in method
        query = filter.applyToQuery(query, users);

        const results = await query;
        return results.map(UserEntity.fromDB);
    }

    async count(filter: UserFilter = UserFilter.createDefault()): Promise<number> {
        filter.validate();

        // Build conditions using the filter's buildConditions method
        const conditions = filter.buildConditions(users);

        let query: any = this.db.select().from(users);

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        const result = await query;
        return result.length;
    }

    async update(user: UserEntity): Promise<UserEntity> {
        const [updated] = await this.db.update(users)
            .set(user.toUserDB())
            .where(eq(users.id, user.id))
            .returning();
        return UserEntity.fromDB(updated);
    }

    async delete(id: string): Promise<void> {
        await this.db.update(users)
            .set({ status: 'deleted' })
            .where(eq(users.id, id));
    }

    async findByIds(ids: string[]): Promise<UserEntity[]> {
        if (ids.length === 0) return [];

        const { inArray } = await import('drizzle-orm');
        const results = await this.db.select().from(users).where(inArray(users.id, ids));
        return results.map(UserEntity.fromDB);
    }
}