import { User, users } from "@/core/db/schema";
import { UserEntity } from "../entities";
import { Database } from "@/core/db/client";
import { eq } from "drizzle-orm";

export interface UserRepository {
    create(user: UserEntity): Promise<UserEntity>;
    findById(id: string): Promise<UserEntity | null>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findAll(): Promise<UserEntity[]>;
    update(user: UserEntity): Promise<UserEntity>;
    delete(id: string): Promise<void>;
}

export class UserRepositoryImpl implements UserRepository {
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

    async findAll(): Promise<UserEntity[]> {
        const results = await this.db.select().from(users);
        return results.map(UserEntity.fromDB);
    }

    async update(user: UserEntity): Promise<UserEntity> {
        const [updated] = await this.db.update(users)
            .set(user.toUserDB())
            .where(eq(users.id, user.id))
            .returning();
        return UserEntity.fromDB(updated);
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(users).where(eq(users.id, id));
    }
}