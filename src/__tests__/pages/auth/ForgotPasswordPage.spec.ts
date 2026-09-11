import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage.vue";

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
        emailFormat: vi.fn<(val: unknown) => boolean | string>(),
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

describe("ForgotPasswordPage", () => {
    const mockRequestPasswordReset = vi.fn<(email: string) => Promise<void>>();
    const mockNotify = vi.fn<(opts: unknown) => void>();
    const mockPush = vi.fn<(to: string) => Promise<unknown>>();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAuthStore).mockReturnValue({
            requestPasswordReset: mockRequestPasswordReset,
        } as unknown as ReturnType<typeof useAuthStore>);

        vi.mocked(useQuasar).mockReturnValue({
            notify: mockNotify,
        } as unknown as ReturnType<typeof useQuasar>);

        vi.mocked(useRouter).mockReturnValue({
            push: mockPush,
        } as unknown as ReturnType<typeof useRouter>);
    });

    it("should render email input and submit button", () => {
        const wrapper = mount(ForgotPasswordPage);
        expect(wrapper.find('[data-test="email-input"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="submit-btn"]').exists()).toBe(true);
    });

    it("should navigate to login on 'Voltar para login' click", async () => {
        const wrapper = mount(ForgotPasswordPage);
        const backButton = wrapper
            .findAllComponents({ name: "QBtn" })
            .find((b) => b.text().includes("Voltar para login"));

        expect(backButton).toBeDefined();
        await backButton!.trigger("click");

        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should call requestPasswordReset, notify and navigate on success", async () => {
        mockRequestPasswordReset.mockResolvedValueOnce(undefined);
        const wrapper = mount(ForgotPasswordPage);

        const inputs = wrapper.findAllComponents({ name: "QInput" });
        await inputs[0]!.setValue("test@test.com");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(mockRequestPasswordReset).toHaveBeenCalledWith("test@test.com");
        expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: "positive" }));
        expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should show negative notify on failure and not navigate", async () => {
        mockRequestPasswordReset.mockRejectedValueOnce(new Error("Failed"));
        const wrapper = mount(ForgotPasswordPage);

        const inputs = wrapper.findAllComponents({ name: "QInput" });
        await inputs[0]!.setValue("test@test.com");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(mockRequestPasswordReset).toHaveBeenCalledWith("test@test.com");
        expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: "negative" }));
        expect(mockPush).not.toHaveBeenCalled();
    });
});
