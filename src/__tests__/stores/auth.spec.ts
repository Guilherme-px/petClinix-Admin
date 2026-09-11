import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { LoginPayload, AuthResult, User } from "../../domain/models/Auth";

vi.mock("../../infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { useAuthStore } from "../../stores/auth";
import { container } from "../../infrastructure/container";

describe("useAuthStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
    });

    it("should login, set tokens and update state", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>().mockResolvedValue({
                token: "fake-token",
                refreshToken: "fake-refresh",
                email: "admin@petclinix.com",
                role: "Admin",
            }),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>().mockResolvedValue({} as AuthResult),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();

        await store.login({ email: "admin@petclinix.com", password: "Senha@123" });

        expect(store.token).toBe("fake-token");
        expect(store.refreshToken).toBe("fake-refresh");
        expect(store.isAuthenticated).toBe(true);
        expect(store.user?.email).toBe("admin@petclinix.com");
        expect(store.userRole).toBe("Admin");
        expect(localStorage.getItem("token")).toBe("fake-token");
        expect(localStorage.getItem("refreshToken")).toBe("fake-refresh");
    });

    it("should refresh token successfully", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>().mockResolvedValue({
                token: "new-token",
                refreshToken: "new-refresh",
                email: "admin@petclinix.com",
                role: "Admin",
            }),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();
        store.refreshToken = "old-refresh";

        const newToken = await store.doRefreshToken();

        expect(newToken).toBe("new-token");
        expect(store.token).toBe("new-token");
        expect(store.refreshToken).toBe("new-refresh");
        expect(localStorage.getItem("token")).toBe("new-token");
    });

    it("should logout if refresh token fails", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>().mockRejectedValue(new Error("Refresh failed")),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();
        store.token = "expired-token";
        store.refreshToken = "old-refresh";

        const newToken = await store.doRefreshToken();

        expect(newToken).toBeNull();
        expect(store.token).toBeNull();
        expect(store.refreshToken).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("should logout and clear state", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>().mockResolvedValue({
                token: "fake-token",
                refreshToken: "fake-refresh",
                email: "admin@petclinix.com",
                role: "Admin",
            }),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();

        await store.login({ email: "admin@petclinix.com", password: "Senha@123" });

        store.logout();

        expect(store.token).toBeNull();
        expect(store.refreshToken).toBeNull();
        expect(store.isAuthenticated).toBe(false);
        expect(store.userRole).toBeNull();
        expect(localStorage.getItem("token")).toBeNull();
    });

    it("should return null if no refresh token exists", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();

        store.refreshToken = null;

        const result = await store.doRefreshToken();

        expect(result).toBeNull();
        expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it("should fetch user profile successfully", async () => {
        const mockUser: User = {
            id: "123",
            name: "Test User",
            email: "admin@petclinix.com",
            role: "Admin",
        };

        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>().mockResolvedValue(mockUser),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();
        store.token = "fake-token";

        await store.fetchUser();

        expect(store.user).toEqual(mockUser);
        expect(store.isAuthenticating).toBe(false);
    });

    it("should not fetch user if no token exists", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>(),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();
        store.token = null;

        await store.fetchUser();

        expect(mockAuthService.getProfile).not.toHaveBeenCalled();
    });

    it("should throw error and set isAuthenticating to false if fetchUser fails", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>().mockRejectedValue(new Error("Network Error")),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();
        store.token = "fake-token";

        await expect(store.fetchUser()).rejects.toThrow("Network Error");
        expect(store.isAuthenticating).toBe(false);
    });

    it("should clear user if token is removed during fetchUser failure", async () => {
        const store = useAuthStore();
        store.token = "fake-token";
        store.user = { email: "old@test.com", role: "User" } as User;

        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>().mockImplementation(() => {
                store.token = null;
                return Promise.reject(new Error("401 Unauthorized"));
            }),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        await expect(store.fetchUser()).rejects.toThrow("401 Unauthorized");

        expect(store.user).toBeNull();
        expect(store.isAuthenticating).toBe(false);
    });

    it("should call requestPasswordReset successfully", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>(),
            requestPasswordReset: vi
                .fn<(email: string) => Promise<string>>()
                .mockResolvedValue("fake-reset-token"),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();

        const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        await store.requestPasswordReset("test@test.com");

        expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith("test@test.com");
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "Password reset token (Demo Mode):",
            "fake-reset-token",
        );

        consoleLogSpy.mockRestore();
    });

    it("should call setPassword successfully", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>(),
            refreshToken: vi.fn<(token: string) => Promise<AuthResult>>(),
            getProfile: vi.fn<() => Promise<User>>(),
            requestPasswordReset: vi.fn<(email: string) => Promise<string>>(),
            setPassword: vi
                .fn<(token: string, password: string) => Promise<void>>()
                .mockResolvedValue(undefined),
        };

        (container.resolve as ReturnType<typeof vi.fn>).mockReturnValue(mockAuthService);

        const store = useAuthStore();

        await store.setPassword("fake-reset-token", "NewPassword@123");

        expect(mockAuthService.setPassword).toHaveBeenCalledWith(
            "fake-reset-token",
            "NewPassword@123",
        );
    });
});
