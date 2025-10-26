import { EntityStatus, Err } from "@/types";
import { NextRequest } from "next/server";
import { UserEntity } from "../entities";
import { generateUUIDWithPrefix, UUID_PREFIX } from "@/core/utils/uuid";
import { BaseRequestDto, BaseResponseDto } from "./base";

export class SignupRequest extends BaseRequestDto {

    readonly token: string;        // json "token"
    readonly email: string;        // json "email"
    readonly tenantName?: string;  // json "tenant_name" (optional)
    readonly name?: string;        // json "name" (optional)

    constructor(token: string, email: string, tenantName?: string, name?: string) {
        super();
        this.token = token;
        this.email = email;
        this.tenantName = tenantName;
        this.name = name;
        this.validate();
    }

    static async fromRequest(request: NextRequest): Promise<SignupRequest> {
        const body = await request.json();
        return new SignupRequest(body.token, body.email, body.tenant_name, body.name);
    }

    validate(): void {
        BaseRequestDto.validateRequiredFields({ token: this.token, email: this.email }, ["token", "email"]);
        if (!this.email.includes("@")) {
            Err.validation("Invalid email format")
                .withDetails({ email: this.email })
                .throw();
        }
    }

    toDomain(): UserEntity {
        return UserEntity.create({
            id: generateUUIDWithPrefix(UUID_PREFIX.USER),
            name: this.name ?? this.tenantName ?? "",
            email: this.email,
            avatarUrl: null,
            status: EntityStatus.PUBLISHED,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
        });
    }
}

export class SignupResponse extends BaseResponseDto {
    readonly token: string;
    readonly email: string;

    constructor(token: string, email: string) {
        super();
        this.token = token;
        this.email = email;
    }

    toJson(): Record<string, unknown> {
        return {
            token: this.token,
            email: this.email,
        };
    }
}