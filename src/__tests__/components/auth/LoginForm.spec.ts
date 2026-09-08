import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import LoginForm from "@/components/auth/LoginForm.vue";

describe("LoginForm", () => {
    it("should render email and password inputs", () => {
        const wrapper = mount(LoginForm);
        expect(wrapper.find('[data-test="email-input"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="password-input"]').exists()).toBe(true);
    });

    it("should emit submit with valid payload", async () => {
        const wrapper = mount(LoginForm);

        const inputs = wrapper.findAllComponents({ name: "QInput" });

        await inputs[0]!.setValue("admin@petclinix.com");
        await inputs[1]!.setValue("Senha@123");

        await wrapper.find('[data-test="login-form"]').trigger("submit");
        await flushPromises();

        const emit = wrapper.emitted("submit");
        expect(emit).toBeTruthy();

        const payload = emit?.[0]?.[0] as { email: string; password: string };
        expect(payload).toEqual({
            email: "admin@petclinix.com",
            password: "Senha@123",
        });
    });

    it("should toggle password visibility when eye icon is clicked", async () => {
        const wrapper = mount(LoginForm);

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
