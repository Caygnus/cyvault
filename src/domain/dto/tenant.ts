import { Err } from "@/types/errors";
import { BaseRequestDto, BaseResponseDto } from "./base";
import { TenantEntity } from "../entities";

export class TenantRequest extends BaseRequestDto {
    readonly name: string;
    readonly description: string;

    constructor(name: string, description: string) {
        super();
        this.name = name;
        this.description = description;
        this.validate();
    }

    validate(): void {
        BaseRequestDto.validateRequiredFields({ name: this.name }, ["name"]);
        if (this.description && this.description.length > 255) {
            Err.validation("Description must be less than 255 characters")
                .withDetails({ description: this.description })
                .throw();
        }
    }

    toDomain(): TenantEntity {
        return TenantEntity.create({
            name: this.name,
            description: this.description,
            createdBy: null,
            updatedBy: null,
        });
    }
}

export class TenantUpdateRequest extends BaseRequestDto {
    readonly name?: string;
    readonly description?: string;

    constructor(name?: string, description?: string) {
        super();
        this.name = name;
        this.description = description;
        this.validate();
    }

    validate(): void {
        if (this.name !== undefined && this.name.length < 2) {
            Err.validation("Name must be at least 2 characters long")
                .withDetails({ name: this.name })
                .throw();
        }
        if (this.description !== undefined && this.description.length > 255) {
            Err.validation("Description must be less than 255 characters")
                .withDetails({ description: this.description })
                .throw();
        }
    }
}

export class TenantResponse extends BaseResponseDto {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly status: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(tenant: TenantEntity) {
        super();
        this.id = tenant.id;
        this.name = tenant.name;
        this.description = tenant.description || "";
        this.status = tenant.status;
        this.createdAt = tenant.createdAt;
        this.updatedAt = tenant.updatedAt;
    }

    static fromDomain(tenant: TenantEntity): TenantResponse {
        return new TenantResponse(tenant);
    }

    toJson(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}