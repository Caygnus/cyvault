import { injectable } from "tsyringe";
import { UserEntity } from "@/domain/entities";
import { UserFilter } from "@/domain/filters";
import { RepoParams } from "@/core/di";
import { EntityStatus } from "@/types";
import { Err } from "@/types";

@injectable()
export class UserService {
    constructor(private readonly params: RepoParams) { }

    async getUserById(id: string): Promise<UserEntity | null> {
        const {data, error} = await this.params.userRepository.findById(id);
        if (error) throw error;
        return data;
    }

    async getUserByEmail(email: string): Promise<UserEntity | null> {
        const {data, error} = await this.params.userRepository.findByEmail(email);
        if (error) throw error;
        return data;
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

        const {data, error} = await this.params.userRepository.create(user);
        if (error) throw error;
        return data;
    }

    async listUsers(filter?: UserFilter): Promise<UserEntity[]> {
        const {data, error} = await this.params.userRepository.findAll(filter);
        if (error) throw error;
        return data;
    }

    async updateUser(
        id: string,
        updates: Partial<Pick<UserEntity, "name" | "avatarUrl">>
    ): Promise<UserEntity> {
        const existingUser = await this.getUserById(id);
        if (!existingUser) {
            throw Err.notFound(`User with ID ${id} not found`);
        }

        const updatedUser = existingUser!.with({
            ...updates,
            updatedAt: new Date(),
        });

        const {data, error} = await this.params.userRepository.update(updatedUser);
        if (error) throw error;
        return data!;
    }

    async deleteUser(id: string): Promise<void> {
        const {error} = await this.params.userRepository.delete(id);
        if (error) throw error;
        return undefined;
    }
}