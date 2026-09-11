import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult, User } from "@/domain/models/Auth";

export const createAuthService = (authRepository: IAuthRepository) => {
    return {
        async login(payload: LoginPayload): Promise<AuthResult> {
            return await authRepository.login(payload);
        },

        async refreshToken(token: string): Promise<AuthResult> {
            return await authRepository.refreshToken(token);
        },

        async getProfile(): Promise<User> {
            return await authRepository.getProfile();
        },

        async requestPasswordReset(email: string): Promise<string> {
            return await authRepository.requestPasswordReset(email);
        },

        async setPassword(token: string, password: string): Promise<void> {
            return await authRepository.setPassword(token, password);
        },
    };
};

export type AuthService = ReturnType<typeof createAuthService>;
