import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { container } from "@/infrastructure/container";
import type { LoginPayload, AuthResult, User } from "@/domain/models/Auth";

export const useAuthStore = defineStore("auth", () => {
    const token = ref<string | null>(localStorage.getItem("token"));
    const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));
    const user = ref<User | null>(null);

    const isAuthenticated = computed(() => !!token.value);
    const userRole = computed(() => user.value?.role || null);

    async function login(payload: LoginPayload): Promise<void> {
        const authService = container.resolve<{ login: (p: LoginPayload) => Promise<AuthResult> }>(
            "AuthService",
        );

        const result = await authService.login(payload);
        setAuthData(result);
    }

    async function doRefreshToken(): Promise<string | null> {
        if (!refreshToken.value) return null;
        try {
            const authService = container.resolve<{
                refreshToken: (t: string) => Promise<AuthResult>;
            }>("AuthService");
            const result = await authService.refreshToken(refreshToken.value);
            setAuthData(result);
            return result.token;
        } catch {
            logout();
            return null;
        }
    }

    function setAuthData(result: AuthResult) {
        token.value = result.token;
        refreshToken.value = result.refreshToken;
        user.value = { email: result.email, role: result.role } as User;
        persistTokens();
    }

    function logout() {
        token.value = null;
        refreshToken.value = null;
        user.value = null;

        clearTokens();
    }

    function persistTokens() {
        localStorage.setItem("token", token.value!);
        localStorage.setItem("refreshToken", refreshToken.value!);
    }

    function clearTokens() {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
    }

    return {
        token,
        refreshToken,
        user,
        isAuthenticated,
        userRole,
        login,
        logout,
        doRefreshToken,
    };
});
