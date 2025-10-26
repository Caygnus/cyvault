import { TenantEntity, UserEntity } from "../entities";
import { BaseResponseDto, BaseRequestDto } from "./base";
import { Err } from "@/types/errors";

export class UserRequest extends BaseRequestDto {
    readonly name: string;
    readonly email: string;
    readonly avatarUrl?: string | null;

    constructor(name: string, email: string, avatarUrl?: string | null) {
        super();
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.validate();
    }

    validate(): void {
        BaseRequestDto.validateRequiredFields({ name: this.name, email: this.email }, ["name", "email"]);

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) {
            Err.validation("Invalid email format")
                .withDetails({ email: this.email })
                .throw();
        }

        // Name validation
        if (this.name.length < 2) {
            Err.validation("Name must be at least 2 characters long")
                .withDetails({ name: this.name })
                .throw();
        }
    }

    toDomain(): UserEntity {
        return UserEntity.create({
            name: this.name,
            email: this.email,
            avatarUrl: this.avatarUrl || null,
        });
    }
}

export class UserUpdateRequest extends BaseRequestDto {
    readonly name?: string;
    readonly avatarUrl?: string | null;

    constructor(name?: string, avatarUrl?: string | null) {
        super();
        this.name = name;
        this.avatarUrl = avatarUrl;
        this.validate();
    }

    validate(): void {
        if (this.name !== undefined && this.name.length < 2) {
            Err.validation("Name must be at least 2 characters long")
                .withDetails({ name: this.name })
                .throw();
        }
    }
}

export class UserResponse extends BaseResponseDto {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly avatarUrl: string | null;
    readonly status: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(user: UserEntity) {
        super();
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.avatarUrl = user.avatarUrl;
        this.status = user.status;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    static fromDomain(user: UserEntity): UserResponse {
        return new UserResponse(user);
    }

    toJson(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            avatarUrl: this.avatarUrl,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export class UserWithTenantResponse extends BaseResponseDto {
    readonly user: UserResponse;
    readonly tenant: {
        id: string;
        name: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    };

    constructor(user: UserEntity, tenant: TenantEntity) {
        super();
        this.user = new UserResponse(user);
        this.tenant = {
            id: tenant.id,
            name: tenant.name,
            status: tenant.status,
            createdAt: tenant.createdAt,
            updatedAt: tenant.updatedAt,
        };
    }

    static fromDomain(user: UserEntity, tenant: TenantEntity): UserWithTenantResponse {
        return new UserWithTenantResponse(user, tenant);
    }

    toJson(): Record<string, unknown> {
        return {
            user: this.user.toJson(),
            tenant: this.tenant,
        };
    }
}