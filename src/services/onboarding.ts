import { RepoParams } from "@/core/di";
import { SignupRequest } from "@/domain/dto/auth";
import { UserEntity } from "@/domain/entities";

interface OnboardingService {
    onboardUserWithTenant(request: SignupRequest, user: UserEntity): Promise<void>;
}

export class OnboardingServiceImpl implements OnboardingService {
    constructor(private readonly params: RepoParams) { }

    async onboardUserWithTenant(request: SignupRequest, user: UserEntity): Promise<void> {
    }
}