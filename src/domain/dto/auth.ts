import { EntityStatus, Err } from "@/types";
import { NextRequest } from "next/server";
import { UserEntity } from "../entities";
import { generateUUIDWithPrefix, UUID_PREFIX } from "@/core/utils/uuid";
import { BaseRequestDto, BaseResponseDto } from "./base";

export class SignupRequest extends BaseRequestDto {

    readonly token: string;        // json "token"
    readonly email: string;        // json "email"
    readonly tenant_name?: string;  // json "tenant_name" (optional)
    readonly name?: string;        // json "name" (optional)

    constructor(token: string, email: string, tenant_name?: string, name?: string) {
        super();
        this.token = token;
        this.email = email;
        this.tenant_name = tenant_name;
        this.name = name;
        this.validate();
    }

    static async fromRequest(request: NextRequest): Promise<SignupRequest> {
        const body = await request.json();
        return new SignupRequest(body.token, body.email, body.tenant_name ?? undefined, body.name ?? undefined);
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
            name: this.name ?? this.tenant_name ?? "",
            email: this.email,
            avatarUrl: undefined,
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