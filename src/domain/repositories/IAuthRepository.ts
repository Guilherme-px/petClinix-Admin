import type { LoginPayload, AuthResult } from "@/domain/models/Auth";

export interface IAuthRepository {
    login(payload: LoginPayload): Promise<AuthResult>;
}
