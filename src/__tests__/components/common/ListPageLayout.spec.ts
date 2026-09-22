import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { Quasar } from "quasar";
import { defineComponent, h } from "vue";
import ListPageLayout from "../../../components/common/ListPageLayout.vue";

const SlotStub = defineComponent({
    name: "QPageStub",
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

describe("ListPageLayout", () => {
    const mountLayout = (slots: Record<string, unknown> = {}) =>
        mount(ListPageLayout, {
            props: { title: "Serviços" },
            slots,
            global: {
                plugins: [Quasar],
                stubs: { QPage: SlotStub },
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
