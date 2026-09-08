import { describe, it, expect, vi } from "vitest";

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: vi.fn<() => ReturnType<typeof actual.useQuasar>>(),
    };
});

import { mount } from "@vue/test-utils";
import AppLogo from "@/components/AppLogo.vue";
import logoDesktop from "@/assets/logo.png";
import logoMobile from "@/assets/logo-mobile.png";
import { useQuasar } from "quasar";

type QuasarMock = ReturnType<typeof useQuasar>;

describe("AppLogo", () => {
    it("should render an img tag", () => {
        vi.mocked(useQuasar).mockReturnValue({ screen: { xs: false } } as unknown as QuasarMock);
        const wrapper = mount(AppLogo);
        expect(wrapper.find("img").exists()).toBe(true);
    });

    it("should use desktop logo on larger screens", () => {
        vi.mocked(useQuasar).mockReturnValue({ screen: { xs: false } } as unknown as QuasarMock);
        const wrapper = mount(AppLogo);
        expect(wrapper.find("img").attributes("src")).toBe(logoDesktop);
    });

    it("should use mobile logo on xs screens", () => {
        vi.mocked(useQuasar).mockReturnValue({ screen: { xs: true } } as unknown as QuasarMock);
        const wrapper = mount(AppLogo);
        expect(wrapper.find("img").attributes("src")).toBe(logoMobile);
    });
});
