import { RepoParams } from "@/core/di";
import { SignupRequest, TenantRequest, UserEntity } from "@/domain";

interface OnboardingService {
    onboardUser(request: SignupRequest, user: UserEntity): Promise<void>;
}

export class OnboardingServiceImpl implements OnboardingService {
    constructor(private readonly params: RepoParams) { }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async onboardUser(request: SignupRequest, user: UserEntity): Promise<void> {
        const tenantRequest = new TenantRequest(request.tenantName ?? "", "");
        const tenant = tenantRequest.toDomain();
        console.log('tenant', tenant);

    }
}