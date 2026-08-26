import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import type { LoginPayload, AuthResult } from "../../domain/models/Auth";

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

    it("should logout and clear state", async () => {
        const mockAuthService = {
            login: vi.fn<(payload: LoginPayload) => Promise<AuthResult>>().mockResolvedValue({
                token: "fake-token",
                refreshToken: "fake-refresh",
                email: "admin@petclinix.com",
                role: "Admin",
            }),
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
});
