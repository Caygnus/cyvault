import { RepoParams } from "@/core/di";
import { createClient } from "@/core/supabase/server";
import { SignupRequest, SignupResponse } from "@/domain/dto/auth";
import { OnboardingServiceImpl } from "./onboarding";

interface AuthService {
    signup(request: SignupRequest): Promise<SignupResponse>;
}

export class AuthServiceImpl implements AuthService {
    constructor(private readonly params: RepoParams) { }

    async signup(request: SignupRequest): Promise<SignupResponse> {
        request.validate();
        let user = request.toDomain();

        // get the user from supabase for its id 
        const supabase = await createClient();
        const { data: { user: supabaseUser }, error: supabaseError } = await supabase.auth.getUser(request.token);
        if (supabaseError) throw supabaseError;

        user = user.with({ id: supabaseUser?.id ?? "" });

        const { data, error } = await this.params.userRepository.create(user);
        if (error) throw error;

        // onboard the user with tenant 
        const onboardingService = new OnboardingServiceImpl(this.params);
        await onboardingService.onboardUser(request, user);

        return new SignupResponse(data.id, data.email);
    }
}