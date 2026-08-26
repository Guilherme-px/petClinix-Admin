import { AuthResult, LoginPayload } from "./../../domain/models/Auth";
import { describe, it, expect, vi } from "vitest";
import { createAuthService } from "../../application/services/authService";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";

describe("authService", () => {
    it("should call repository login and return result", async () => {
        const mockRepo: IAuthRepository = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>().mockResolvedValue({
                token: "fake-token",
                refreshToken: "fake-refresh",
                email: "admin@petclinix.com",
                role: "Admin",
            }),
        };

        const service = createAuthService(mockRepo);

        const result = await service.login({
            email: "admin@petclinix.com",
            password: "Senha@123",
        });

        expect(mockRepo.login).toHaveBeenCalledWith({
            email: "admin@petclinix.com",
            password: "Senha@123",
        });
        expect(result.token).toBe("fake-token");
    });
});
