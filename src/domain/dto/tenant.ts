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

export class TenantResponse extends BaseResponseDto {
    readonly id: string;
    readonly name: string;
    readonly description: string;

    constructor(id: string, name: string, description: string) {
        super();
        this.id = id;
        this.name = name;
        this.description = description;
    }

    toJson(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
        };
    }
}