import RequestContext from "@/core/context/context";
import { VaultEntity } from "../entities";
import { BaseResponseDto, BaseRequestDto } from "./base";
import { Err } from "@/types/errors";

export class VaultRequest extends BaseRequestDto {
    readonly name: string;
    readonly description?: string | null;
    readonly iconUrl?: string | null;
    readonly color?: string | null;
    readonly metadata?: Record<string, string> | null;

    constructor(
        name: string,
        description?: string | null,
        iconUrl?: string | null,
        color?: string | null,
        metadata?: Record<string, string> | null
    ) {
        super();
        this.name = name;
        this.description = description;
        this.iconUrl = iconUrl;
        this.color = color;
        this.metadata = metadata;
        this.validate();
    }

    validate(): void {
        BaseRequestDto.validateRequiredFields({ name: this.name }, ["name"]);

        // Name validation
        if (this.name.length < 1) {
            Err.validation("Name must be at least 1 character long")
                .withDetails({ name: this.name })
                .throw();
        }

        if (this.name.length > 255) {
            Err.validation("Name must be less than 255 characters")
                .withDetails({ name: this.name })
                .throw();
        }

        // Description validation
        if (this.description && this.description.length > 1000) {
            Err.validation("Description must be less than 1000 characters")
                .withDetails({ description: this.description })
                .throw();
        }

        // Color validation (basic hex color format)
        if (this.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(this.color) && this.color.length > 0) {
            Err.validation("Color must be a valid hex color (e.g., #FF0000 or #F00)")
                .withDetails({ color: this.color })
                .throw();
        }
    }

    toDomain(): VaultEntity {
        const userId = RequestContext.tryGetUserId();
        const tenantId = RequestContext.getTenantId();

        return VaultEntity.create({
            name: this.name,
            description: this.description || null,
            iconUrl: this.iconUrl || null,
            color: this.color || null,
            metadata: this.metadata || null,
            userId: userId || "",
            tenantId: tenantId || "",
            updatedBy: userId,
            createdBy: userId,
        });
    }
}

export class VaultUpdateRequest extends BaseRequestDto {
    readonly name?: string;
    readonly description?: string | null;
    readonly iconUrl?: string | null;
    readonly color?: string | null;
    readonly metadata?: Record<string, string> | null;

    constructor(
        name?: string,
        description?: string | null,
        iconUrl?: string | null,
        color?: string | null,
        metadata?: Record<string, string> | null
    ) {
        super();
        this.name = name;
        this.description = description;
        this.iconUrl = iconUrl;
        this.color = color;
        this.metadata = metadata;
        this.validate();
    }

    validate(): void {
        if (this.name !== undefined) {
            if (this.name.length < 1) {
                Err.validation("Name must be at least 1 character long")
                    .withDetails({ name: this.name })
                    .throw();
            }
            if (this.name.length > 255) {
                Err.validation("Name must be less than 255 characters")
                    .withDetails({ name: this.name })
                    .throw();
            }
        }

        if (this.description !== undefined && this.description && this.description.length > 1000) {
            Err.validation("Description must be less than 1000 characters")
                .withDetails({ description: this.description })
                .throw();
        }

        // Color validation (basic hex color format)
        if (this.color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(this.color) && this.color.length > 0) {
            Err.validation("Color must be a valid hex color (e.g., #FF0000 or #F00)")
                .withDetails({ color: this.color })
                .throw();
        }
    }
}

export class VaultResponse extends BaseResponseDto {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    readonly iconUrl: string | null;
    readonly color: string | null;
    readonly metadata: Record<string, string> | null;
    readonly userId: string;
    readonly tenantId: string;
    readonly status: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(vault: VaultEntity) {
        super();
        this.id = vault.id;
        this.name = vault.name;
        this.description = vault.description;
        this.iconUrl = vault.iconUrl;
        this.color = vault.color;
        this.metadata = vault.metadata;
        this.userId = vault.userId;
        this.tenantId = vault.tenantId;
        this.status = vault.status;
        this.createdAt = vault.createdAt;
        this.updatedAt = vault.updatedAt;
    }

    static fromDomain(vault: VaultEntity): VaultResponse {
        return new VaultResponse(vault);
    }

    toJson(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            iconUrl: this.iconUrl,
            color: this.color,
            metadata: this.metadata,
            userId: this.userId,
            tenantId: this.tenantId,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

