import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import LoginForm from "../../components/auth/LoginForm.vue";

describe("LoginForm", () => {
    it("should render email and password inputs", () => {
        const wrapper = mount(LoginForm);
        expect(wrapper.find('[data-test="email-input"]').exists()).toBe(true);
        expect(wrapper.find('[data-test="password-input"]').exists()).toBe(true);
    });

    it("should emit submit with valid payload", async () => {
        const wrapper = mount(LoginForm);

        const [emailInput, passwordInput] = wrapper.findAllComponents({ name: "QInput" });

        await emailInput.setValue("admin@petclinix.com");
        await passwordInput.setValue("Senha@123");

        await wrapper.find('[data-test="login-form"]').trigger("submit");
        await flushPromises();

        const emit = wrapper.emitted("submit");
        expect(emit).toBeTruthy();
        expect(emit?.[0][0]).toEqual({
            email: "admin@petclinix.com",
            password: "Senha@123",
        });
    });
});
