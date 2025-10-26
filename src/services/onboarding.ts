import { RepoParams } from "@/core/di";
import { SignupRequest } from "@/domain/dto/auth";
import { UserEntity } from "@/domain/entities";

interface OnboardingService {
    onboardUser(request: SignupRequest, user: UserEntity): Promise<void>;
}

export class OnboardingServiceImpl implements OnboardingService {
    constructor(private readonly params: RepoParams) { }

    async onboardUser(request: SignupRequest, user: UserEntity): Promise<void> {
        // TODO: Implement onboarding logic
    }
}