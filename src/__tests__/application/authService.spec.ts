import { describe, it, expect, vi } from "vitest";
import { createAuthService } from "../../application/services/authService";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { LoginPayload, AuthResult, User } from "../../domain/models/Auth";

describe("authService", () => {
    const mockAuthResult: AuthResult = {
        token: "new-fake-token",
        refreshToken: "new-fake-refresh",
        email: "admin@petclinix.com",
        role: "Admin",
    };

    const mockUser: User = {
        id: "user-id",
        name: "Admin User",
        email: "admin@petclinix.com",
        role: "Admin",
    };

    const mockResetToken = "fake-reset-token";

    const mockRepo: IAuthRepository = {
        login: vi
            .fn<(payload: LoginPayload) => Promise<AuthResult>>()
            .mockResolvedValue(mockAuthResult),
        refreshToken: vi
            .fn<(token: string) => Promise<AuthResult>>()
            .mockResolvedValue(mockAuthResult),
        getProfile: vi.fn<() => Promise<User>>().mockResolvedValue(mockUser),
        requestPasswordReset: vi
            .fn<(email: string) => Promise<string>>()
            .mockResolvedValue(mockResetToken),
        setPassword: vi
            .fn<(token: string, password: string) => Promise<void>>()
            .mockResolvedValue(undefined),
    };

    it("should call repository login and return result", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.login({ email: "admin@petclinix.com", password: "Senha@123" });

        expect(mockRepo.login).toHaveBeenCalledWith({
            email: "admin@petclinix.com",
            password: "Senha@123",
        });
        expect(result.token).toBe("new-fake-token");
    });

    it("should call repository refreshToken and return result", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.refreshToken("old-refresh-token");

        expect(mockRepo.refreshToken).toHaveBeenCalledWith("old-refresh-token");
        expect(result.token).toBe("new-fake-token");
    });

    it("should call repository getProfile and return user", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.getProfile();

        expect(mockRepo.getProfile).toHaveBeenCalled();
        expect(result).toEqual(mockUser);
    });

    it("should call repository requestPasswordReset and return token", async () => {
        const service = createAuthService(mockRepo);
        const result = await service.requestPasswordReset("admin@petclinix.com");

        expect(mockRepo.requestPasswordReset).toHaveBeenCalledWith("admin@petclinix.com");
        expect(result).toBe(mockResetToken);
    });

    it("should call repository setPassword", async () => {
        const service = createAuthService(mockRepo);
        await service.setPassword("fake-reset-token", "NewPassword@123");

        expect(mockRepo.setPassword).toHaveBeenCalledWith("fake-reset-token", "NewPassword@123");
    });
});
