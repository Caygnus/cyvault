import { User } from '../../core/db/schema/user';

export class UserEntity {
    constructor(
        public readonly id: string, // Supabase UUID
        public readonly name: string,
        public readonly email: string,
        public readonly avatarUrl: string | null,
        public readonly createdAt: Date | null,
        public readonly updatedAt: Date | null
    ) { }

    static fromDB(user: User): UserEntity {
        return new UserEntity(
            user.id,
            user.name,
            user.email,
            user.avatarUrl,
            user.createdAt,
            user.updatedAt
        );
    }
    toDB(): User {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            avatarUrl: this.avatarUrl,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
