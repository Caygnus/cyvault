import { RepoParams } from "@/core/di";
import { SignupRequest, TenantRequest, UserEntity } from "@/domain";
import { createClient } from "@/core/supabase/server";

export interface OnboardingService {
    onboardUser(request: SignupRequest, user: UserEntity): Promise<void>;
}

export class OnboardingServiceImpl implements OnboardingService {
    constructor(private readonly params: RepoParams) { }

    async onboardUser(request: SignupRequest, user: UserEntity): Promise<void> {
        const tenantRequest = new TenantRequest(request.tenantName ?? "", "");
        const tenant = tenantRequest.toDomain();

        const { data: tenantData, error: tenantError } = await this.params.tenantRepository.create(tenant);
        if (tenantError) throw tenantError;

        // Update the Supabase user with the tenant id using Admin API
        const supabase = await createClient();
        const { error: err } = await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
                tenant_id: tenantData.id
            }
        });
        if (err) throw err;

        // Also update the user entity in our database with tenant_id
        const updatedUser = user.with({
            updatedAt: new Date(),
            updatedBy: user.id,
            createdBy: user.id,
            tenantId: tenantData.id,
        });

        const { error: userUpdateError } = await this.params.userRepository.update(updatedUser);
        if (userUpdateError) throw userUpdateError;
    }
}