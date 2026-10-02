import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import ListPageLayout from "../../../components/common/ListPageLayout.vue";
import { QPageStub } from "../../../test/helpers/stubs";

describe("ListPageLayout", () => {
    const mountLayout = (
        slots: { default?: () => ReturnType<typeof h>; actions?: () => ReturnType<typeof h> } = {},
    ) =>
        mount(ListPageLayout, {
            props: { title: "Serviços" },
            slots,
            global: {
                stubs: { QPage: QPageStub },
            },
        });

    it("should render title and default slot inside page container", () => {
        const wrapper = mountLayout({
            default: () => h("div", "TABLE CONTENT"),
        });

        expect(wrapper.text()).toContain("Serviços");
        expect(wrapper.text()).toContain("TABLE CONTENT");
        expect(wrapper.find(".page-container").exists()).toBe(true);
    });

    it("should render actions slot in the header", () => {
        const wrapper = mountLayout({
            actions: () => h("div", "ACTION BUTTON"),
        });

        expect(wrapper.find(".page-header").text()).toContain("ACTION BUTTON");
    });
});
