import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage.vue";

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

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => ({
        required: vi.fn<(val: unknown) => boolean | string>(),
        passwordRules: vi.fn<(val: unknown) => boolean | string>(),
        confirmPasswordRules: vi.fn<(compareValue: string) => (val: string) => boolean | string>(),
    }),
}));

vi.mock("@/components/AppLogo.vue", () => ({
    default: {
        name: "AppLogo",
        template: "<div />",
    },
}));

import { useAuthStore } from "@/stores/auth";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

describe("ResetPasswordPage", () => {
    const mockSetPassword = vi.fn<(token: string, password: string) => Promise<void>>();
    const mockNotify = vi.fn<(opts: unknown) => void>();
    const mockPush = vi.fn<(to: string) => Promise<unknown>>();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuthStore).mockReturnValue({
            setPassword: mockSetPassword,
        } as unknown as ReturnType<typeof useAuthStore>);

        vi.mocked(useQuasar).mockReturnValue({
            notify: mockNotify,
        } as unknown as ReturnType<typeof useQuasar>);

        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>);
    });

    it("should render token, password and confirm password inputs", () => {
        const wrapper = mount(ResetPasswordPage);
        expect(wrapper.find('[data-test="token-input"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="password-input"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="confirm-password-input"]').exists()).toBe(true);
    });

    it("should navigate to login on 'Voltar para login' click", async () => {
        const wrapper = mount(ResetPasswordPage);
        const backButton = wrapper
            .findAllComponents({ name: "QBtn" })
            .find((b) => b.text().includes("Voltar para login"));

        expect(backButton).toBeDefined();
        await backButton!.trigger("click");

        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should call setPassword, notify and navigate on success", async () => {
        mockSetPassword.mockResolvedValueOnce(undefined);
        const wrapper = mount(ResetPasswordPage);

        const inputs = wrapper.findAllComponents({ name: "QInput" });
        await inputs[0]!.setValue("fake-token");
        await inputs[1]!.setValue("NewPassword@123");
        await inputs[2]!.setValue("NewPassword@123");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(mockSetPassword).toHaveBeenCalledWith("fake-token", "NewPassword@123");
        expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: "positive" }));
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should show negative notify on failure and not navigate", async () => {
        mockSetPassword.mockRejectedValueOnce(new Error("Failed"));
        const wrapper = mount(ResetPasswordPage);

        const inputs = wrapper.findAllComponents({ name: "QInput" });
        await inputs[0]!.setValue("invalid-token");
        await inputs[1]!.setValue("NewPassword@123");
        await inputs[2]!.setValue("NewPassword@123");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(mockSetPassword).toHaveBeenCalledWith("invalid-token", "NewPassword@123");
        expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: "negative" }));
        expect(mockPush).not.toHaveBeenCalled();
    });

    it("should toggle password visibility when eye icon is clicked", async () => {
        const wrapper = mount(ResetPasswordPage);

        const inputs = wrapper.findAllComponents({ name: "QInput" });
        const passwordInput = inputs[1]!;
        const toggleIcon = wrapper.find(".q-icon.cursor-pointer");

        expect(passwordInput.props("type")).toBe("password");

        await toggleIcon.trigger("click");
        expect(passwordInput.props("type")).toBe("text");

        await toggleIcon.trigger("click");
        expect(passwordInput.props("type")).toBe("password");
    });
});
