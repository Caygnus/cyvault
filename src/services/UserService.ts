import { injectable } from "tsyringe";
import { UserEntity } from "@/domain/entities";
import { UserFilter } from "@/domain/filters";
import { RepoParams } from "@/core/di";
import { EntityStatus } from "@/types";

@injectable()
export class UserService {
    constructor(private readonly params: RepoParams) { }

    async getUserById(id: string): Promise<UserEntity | null> {
        const [user, error] = await this.params.userRepository.findById(id);
        if (error) throw error;
        return user;
    }

    async getUserByEmail(email: string): Promise<UserEntity | null> {
        const [user, error] = await this.params.userRepository.findByEmail(email);
        if (error) throw error;
        return user;
    }

    async createUser(userData: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string | null;
    }): Promise<UserEntity> {
        const existingUser = await this.getUserByEmail(userData.email);
        if (existingUser) {
            throw new Error(`User with email ${userData.email} already exists`);
        }

        const user = new UserEntity(
            userData.id,
            userData.name,
            userData.email,
            userData.avatarUrl || null,
            EntityStatus.PUBLISHED,
            new Date(),
            new Date(),
            null,
            null
        );

        const [created, error] = await this.params.userRepository.create(user);
        if (error) throw error;
        return created!;
    }

    async listUsers(filter?: UserFilter): Promise<UserEntity[]> {
        const [users, error] = await this.params.userRepository.findAll(filter);
        if (error) throw error;
        return users;
    }

    async updateUser(
        id: string,
        updates: Partial<Pick<UserEntity, "name" | "avatarUrl">>
    ): Promise<UserEntity> {
        const existingUser = await this.getUserById(id);
        if (!existingUser) {
            throw new Error(`User with ID ${id} not found`);
        }

        const updatedUser = existingUser.with({
            ...updates,
            updatedAt: new Date(),
        });

        const [result, error] = await this.params.userRepository.update(updatedUser);
        if (error) throw error;
        return result!;
    }

    async deleteUser(id: string): Promise<void> {
        const [, error] = await this.params.userRepository.delete(id);
        if (error) throw error;
    }
}