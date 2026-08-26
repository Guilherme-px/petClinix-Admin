import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult } from "@/domain/models/Auth";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class AuthRepository implements IAuthRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async login(payload: LoginPayload): Promise<AuthResult> {
        return this.httpClient.post<AuthResult>("/api/users/login", payload);
    }
}
