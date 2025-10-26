import { Err } from "@/types/errors";
import { BaseRequestDto } from "./base";
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