import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LoginPage from "@/pages/auth/LoginPage.vue";
import LoginForm from "@/components/auth/LoginForm.vue";

describe("LoginPage", () => {
    it("should render the LoginForm component", () => {
        const wrapper = mount(LoginPage);
        expect(wrapper.findComponent(LoginForm).exists()).toBe(true);
    });

    it("should render the main logo on mobile", () => {
        const wrapper = mount(LoginPage);
        expect(wrapper.find(".mobile-logo-header").exists()).toBe(true);
    });
});
