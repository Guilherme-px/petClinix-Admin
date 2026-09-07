import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult } from "@/domain/models/Auth";

export const createAuthService = (authRepository: IAuthRepository) => {
    return {
        async login(payload: LoginPayload): Promise<AuthResult> {
            return await authRepository.login(payload);
        },

        async refreshToken(token: string): Promise<AuthResult> {
            console.log("renovando...", token);
            return await authRepository.refreshToken(token);
        },
    };
};

export type AuthService = ReturnType<typeof createAuthService>;
