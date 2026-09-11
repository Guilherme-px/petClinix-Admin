import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult, User } from "@/domain/models/Auth";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class AuthRepository implements IAuthRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async login(payload: LoginPayload): Promise<AuthResult> {
        return this.httpClient.post<AuthResult>("/api/users/login", payload);
    }

    async refreshToken(refreshToken: string): Promise<AuthResult> {
        return this.httpClient.post<AuthResult>("/api/users/refresh", { refreshToken });
    }

    async getProfile(): Promise<User> {
        return this.httpClient.get<User>("/api/users/me");
    }

    async requestPasswordReset(email: string): Promise<string> {
        const response = await this.httpClient.get<{ token: string }>(
            `/api/users/${email}/generate-reset-token`,
        );
        return response.token;
    }

    async setPassword(token: string, password: string): Promise<void> {
        await this.httpClient.post<void>("/api/users/set-password", { token, password });
    }
}
