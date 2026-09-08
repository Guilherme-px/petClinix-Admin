import { describe, it, expect, vi } from "vitest";
import { createAuthService } from "../../application/services/authService";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult } from "../../domain/models/Auth";

describe("authService", () => {
    const mockAuthResult: AuthResult = {
        token: "new-fake-token",
        refreshToken: "new-fake-refresh",
        email: "admin@petclinix.com",
        role: "Admin",
    };

    const mockRepo: IAuthRepository = {
        login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>().mockResolvedValue(mockAuthResult),
        refreshToken: vi.fn<(token: string) => Promise<AuthResult>>().mockResolvedValue(mockAuthResult),
    };

    it("should call repository login and return result", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.login({ email: "admin@petclinix.com", password: "Senha@123" });

        expect(mockRepo.login).toHaveBeenCalledWith({ email: "admin@petclinix.com", password: "Senha@123" });
        expect(result.token).toBe("new-fake-token");
    });

    it("should call repository refreshToken and return result", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.refreshToken("old-refresh-token");

        expect(mockRepo.refreshToken).toHaveBeenCalledWith("old-refresh-token");
        expect(result.token).toBe("new-fake-token");
    });
});
