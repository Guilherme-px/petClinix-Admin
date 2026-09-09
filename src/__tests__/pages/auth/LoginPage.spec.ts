import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import LoginPage from "@/pages/auth/LoginPage.vue";
import LoginForm from "@/components/auth/LoginForm.vue";
import type { LoginPayload } from "@/domain/models/Auth";

vi.mock("@/stores/auth", () => ({
    useAuthStore: vi.fn<() => unknown>(),
}));

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: vi.fn<() => unknown>(),
    };
});

vi.mock("vue-router", () => ({
    useRouter: vi.fn<() => unknown>(),
}));

import { useAuthStore } from "@/stores/auth";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

describe("LoginPage", () => {
    const mockLogin = vi.fn<(payload: LoginPayload) => Promise<void>>();
    const mockNotify = vi.fn<(opts: unknown) => void>();
    const mockPush = vi.fn<(to: string) => Promise<unknown>>();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuthStore).mockReturnValue({
            login: mockLogin,
        } as unknown as ReturnType<typeof useAuthStore>);

        vi.mocked(useQuasar).mockReturnValue({
            notify: mockNotify,
            screen: { xs: false },
        } as unknown as ReturnType<typeof useQuasar>);

        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>);
    });

    it("should render the LoginForm component", () => {
        const wrapper = mount(LoginPage);
        expect(wrapper.findComponent(LoginForm).exists()).toBe(true);
    });

    it("should render the main logo on mobile", () => {
        const wrapper = mount(LoginPage);
        expect(wrapper.find(".mobile-logo-header").exists()).toBe(true);
    });

    it("should login successfully and redirect", async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        const wrapper = mount(LoginPage);

        wrapper
            .findComponent(LoginForm)
            .vm.$emit("submit", { email: "test@test.com", password: "123" });

        await vi.dynamicImportSettled();
        await wrapper.vm.$nextTick();

        expect(mockLogin).toHaveBeenCalledWith({ email: "test@test.com", password: "123" });
        expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: "positive" }));
        expect(mockPush).toHaveBeenCalledWith("/appointments");
    });

    it("should show error notification if login fails with FetchError", async () => {
        const errorResponse = {
            message: "Request failed",
            data: { errorMessage: "Credenciais inválidas" },
        };
        mockLogin.mockRejectedValueOnce(errorResponse);

        const wrapper = mount(LoginPage);
        wrapper
            .findComponent(LoginForm)
            .vm.$emit("submit", { email: "test@test.com", password: "wrong" });

        await vi.dynamicImportSettled();
        await wrapper.vm.$nextTick();

        expect(mockNotify).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Credenciais inválidas",
            }),
        );
    });

    it("should show generic error notification if login fails without errorMessage", async () => {
        const genericError = new Error("Network Error");
        mockLogin.mockRejectedValueOnce(genericError);

        const wrapper = mount(LoginPage);
        wrapper
            .findComponent(LoginForm)
            .vm.$emit("submit", { email: "test@test.com", password: "123" });

        await vi.dynamicImportSettled();
        await wrapper.vm.$nextTick();

        expect(mockNotify).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Network Error",
            }),
        );
    });

    it("should show default error notification if error has no message", async () => {
        const emptyError = {};
        mockLogin.mockRejectedValueOnce(emptyError);

        const wrapper = mount(LoginPage);
        wrapper
            .findComponent(LoginForm)
            .vm.$emit("submit", { email: "test@test.com", password: "123" });

        await vi.dynamicImportSettled();
        await wrapper.vm.$nextTick();

        expect(mockNotify).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao fazer login.",
            }),
        );
    });
});
