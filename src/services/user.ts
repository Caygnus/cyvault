import { injectable } from "tsyringe";
import { UserEntity, UserFilter } from "@/domain";
import { RepoParams } from "@/core/di";
import { EntityStatus } from "@/types";
import { Err } from "@/types";
import { 
    UserRequest, 
    UserUpdateRequest, 
    UserResponse, 
    UserWithTenantResponse 
} from "@/domain";

// Service interface
export interface UserService {
    getUserById(id: string): Promise<UserResponse | null>;
    getUserByEmail(email: string): Promise<UserResponse | null>;
    createUser(request: UserRequest): Promise<UserResponse>;
    listUsers(filter?: UserFilter): Promise<UserResponse[]>;
    updateUser(id: string, request: UserUpdateRequest): Promise<UserResponse>;
    deleteUser(id: string): Promise<void>;
    getUsersByIds(ids: string[]): Promise<UserResponse[]>;
}

// Implementation
@injectable()
export class UserServiceImpl implements UserService {
    constructor(private readonly params: RepoParams) { }

    async getUserById(id: string): Promise<UserResponse | null> {
        const { data, error } = await this.params.userRepository.findById(id);
        if (error) throw error;
        return data ? UserResponse.fromDomain(data) : null;
    }

    async getUserByEmail(email: string): Promise<UserResponse | null> {
        const { data, error } = await this.params.userRepository.findByEmail(email);
        if (error) throw error;
        return data ? UserResponse.fromDomain(data) : null;
    }

    async createUser(request: UserRequest): Promise<UserResponse> {
        request.validate();
        
        const existingUser = await this.getUserByEmail(request.email);
        if (existingUser) {
            throw Err.validation(`User with email ${request.email} already exists`)
                .withDetails({ email: request.email })
                .build();
        }

        const user = request.toDomain();
        const { data, error } = await this.params.userRepository.create(user);
        if (error) throw error;
        return UserResponse.fromDomain(data);
    }

    async listUsers(filter?: UserFilter): Promise<UserResponse[]> {
        const { data, error } = await this.params.userRepository.findAll(filter);
        if (error) throw error;
        return data.map(UserResponse.fromDomain);
    }

    async updateUser(id: string, request: UserUpdateRequest): Promise<UserResponse> {
        request.validate();
        
        const existingUser = await this.getUserById(id);
        if (!existingUser) {
            throw Err.notFound(`User with ID ${id} not found`);
        }

        const { data: userEntity, error: fetchError } = await this.params.userRepository.findById(id);
        if (fetchError) throw fetchError;
        if (!userEntity) {
            throw Err.notFound(`User with ID ${id} not found`);
        }

        const updatedUser = userEntity.with({
            ...request,
            updatedAt: new Date(),
        });

        const { data, error } = await this.params.userRepository.update(updatedUser);
        if (error) throw error;
        return UserResponse.fromDomain(data);
    }

    async deleteUser(id: string): Promise<void> {
        const { error } = await this.params.userRepository.delete(id);
        if (error) throw error;
        return undefined;
    }

    async getUsersByIds(ids: string[]): Promise<UserResponse[]> {
        const { data, error } = await this.params.userRepository.findByIds(ids);
        if (error) throw error;
        return data.map(UserResponse.fromDomain);
    }
}