import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult, User, UpdateAccountPayload } from "@/domain/models/Auth";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/users";

export class AuthRepository implements IAuthRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async login(payload: LoginPayload): Promise<AuthResult> {
        return this.httpClient.post<AuthResult>(`${BASE_URL}/login`, payload);
    }

    async refreshToken(refreshToken: string): Promise<AuthResult> {
        return this.httpClient.post<AuthResult>(`${BASE_URL}/refresh`, { refreshToken });
    }

    async getProfile(): Promise<User> {
        return this.httpClient.get<User>(`${BASE_URL}/me`);
    }

    async requestPasswordReset(email: string): Promise<string> {
        const response = await this.httpClient.get<{ token: string }>(
            `${BASE_URL}/${email}/generate-reset-token`,
        );
        return response.token;
    }

    async setPassword(token: string, password: string): Promise<void> {
        await this.httpClient.post<void>(`${BASE_URL}/set-password`, { token, password });
    }

    async updateAccount(payload: UpdateAccountPayload): Promise<void> {
        await this.httpClient.put<void>("/api/account/me", payload);
    }
}
