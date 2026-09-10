import type { LoginPayload, AuthResult, User } from "@/domain/models/Auth";

export interface IAuthRepository {
    login(payload: LoginPayload): Promise<AuthResult>;
    refreshToken(refreshToken: string): Promise<AuthResult>;
    getProfile(): Promise<User>;
    requestPasswordReset(email: string): Promise<string>;
}
