import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthRepository } from "../../../infrastructure/repositories/AuthRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import type { AuthResult, UpdateAccountPayload, User } from "../../../domain/models/Auth";

describe("AuthRepository", () => {
    let httpClientMock: HttpClientMock;
    let authRepository: AuthRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        authRepository = new AuthRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call login endpoint with correct payload", async () => {
        const mockResult: AuthResult = {
            token: "fake-token",
            refreshToken: "fake-refresh",
            email: "admin@test.com",
            name: "Admin User",
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
            name: "Admin User",
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

    it("should call setPassword endpoint with correct payload", async () => {
        const token = "fake-reset-token";
        const password = "NewPassword@123";

        vi.mocked(httpClientMock.post).mockResolvedValue(undefined);

        await authRepository.setPassword(token, password);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/users/set-password", {
            token,
            password,
        });
    });

    it("should call updateAccount endpoint with correct payload", async () => {
        const payload: UpdateAccountPayload = {
            userName: "Updated Name",
            userPhoneNumber: "11999998888",
            userBirthDate: "1990-01-01",
            newPassword: "NewPassword@123",
            clinicTradeName: "Updated Clinic",
            clinicLegalName: "Updated LLC",
            clinicDocumentNumber: "12345678000199",
            clinicEmail: "clinic@test.com",
            clinicPhoneNumber: "11988887777",
            clinicZipCode: "01001000",
            clinicStreet: "Updated Street",
            clinicNumber: "123",
            clinicNeighborhood: "Center",
            clinicComplement: "Apt 1",
            clinicCity: "Sao Paulo",
            clinicState: "SP",
        };

        vi.mocked(httpClientMock.put).mockResolvedValue(undefined);

        await authRepository.updateAccount(payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/account/me", payload);
    });
});
