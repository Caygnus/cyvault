import { TenantEntity, UserEntity } from "../entities";
import { BaseResponseDto } from "./base";

export class UserResponse extends BaseResponseDto {
    constructor(readonly user: UserEntity, readonly tenant: TenantEntity) {
        super();
    }

    static fromDomain(user: UserEntity, tenant: TenantEntity): UserResponse {
        return new UserResponse(user, tenant);
    }

    toJson(): Record<string, unknown> {
        return {
            user: {
                id: this.user.id,
                name: this.user.name,
                email: this.user.email,
                avatarUrl: this.user.avatarUrl,
                status: this.user.status,
                createdAt: this.user.createdAt,
                updatedAt: this.user.updatedAt,
                tenant: {
                    id: this.tenant.id,
                    name: this.tenant.name,
                    status: this.tenant.status,
                    createdAt: this.tenant.createdAt,
                    updatedAt: this.tenant.updatedAt,
                }
            },
        };
    }
}