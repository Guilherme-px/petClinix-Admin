import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppLogo from "../components/AppLogo.vue";

describe("AppLogo", () => {
    it("should render an img tag", () => {
        const wrapper = mount(AppLogo);
        expect(wrapper.find("img").exists()).toBe(true);
    });
});
