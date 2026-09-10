import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthRepository } from "../../../infrastructure/repositories/AuthRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import type { AuthResult, User } from "../../../domain/models/Auth";

describe("AuthRepository", () => {
    let httpClientMock: HttpClient;
    let authRepository: AuthRepository;

    beforeEach(() => {
        httpClientMock = {
            post: vi.fn<(url: string, data: unknown) => Promise<AuthResult>>(),
            get: vi.fn<(url: string) => Promise<User>>(),
        } as unknown as HttpClient;

        authRepository = new AuthRepository(httpClientMock);
    });

    it("should call login endpoint with correct payload", async () => {
        const mockResult: AuthResult = {
            token: "fake-token",
            refreshToken: "fake-refresh",
            email: "admin@test.com",
            role: "Admin",
        };

        vi.mocked(httpClientMock.post).mockResolvedValue(mockResult);

        const payload = { email: "admin@test.com", password: "123456" };
        const result = await authRepository.login(payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/users/login", payload);
        expect(result).toEqual(mockResult);
    });

    it("should call refresh token endpoint with correct payload", async () => {
        const mockResult: AuthResult = {
            token: "new-fake-token",
            refreshToken: "new-fake-refresh",
            email: "admin@test.com",
            role: "Admin",
        };

        vi.mocked(httpClientMock.post).mockResolvedValue(mockResult);

        const refreshToken = "old-refresh-token";
        const result = await authRepository.refreshToken(refreshToken);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/users/refresh", { refreshToken });
        expect(result).toEqual(mockResult);
    });

    it("should call getProfile endpoint and return user data", async () => {
        const mockUser: User = {
            id: "123",
            name: "Test User",
            email: "test@test.com",
            role: "Admin",
        };

        vi.mocked(httpClientMock.get).mockResolvedValue(mockUser);

        const result = await authRepository.getProfile();

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/users/me");
        expect(result).toEqual(mockUser);
    });

    it("should call requestPasswordReset endpoint and return token", async () => {
        const mockResponse = { token: "fake-reset-token" };
        const email = "test@test.com";

        vi.mocked(httpClientMock.get).mockResolvedValue(mockResponse);

        const result = await authRepository.requestPasswordReset(email);

        expect(httpClientMock.get).toHaveBeenCalledWith(`/api/users/${email}/generate-reset-token`);
        expect(result).toBe("fake-reset-token");
    });
});
