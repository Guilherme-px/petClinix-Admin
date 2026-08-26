import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult } from "@/domain/models/Auth";

export const createAuthService = (authRepository: IAuthRepository) => {
    return {
        async login(payload: LoginPayload): Promise<AuthResult> {
            return await authRepository.login(payload);
        },
    };
};

export type AuthService = ReturnType<typeof createAuthService>;
