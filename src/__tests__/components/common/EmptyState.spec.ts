import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import EmptyState from "../../../components/common/EmptyState.vue";

describe("EmptyState", () => {
    const mountEmptyState = (props: { image: string; title: string; description?: string }) =>
        mount(EmptyState, {
            props,
        });

    it("should render image with title as alt", () => {
        const wrapper = mountEmptyState({
            image: "empty-staff.svg",
            title: "Nenhum profissional cadastrado",
        });

        const image = wrapper.find("img");
        expect(image.exists()).toBe(true);
        expect(image.attributes("src")).toBe("empty-staff.svg");
        expect(image.attributes("alt")).toBe("Nenhum profissional cadastrado");
    });

    it("should render title text", () => {
        const wrapper = mountEmptyState({
            image: "empty-staff.svg",
            title: "Nenhum profissional cadastrado",
        });

        expect(wrapper.text()).toContain("Nenhum profissional cadastrado");
    });

    it("should render description when provided", () => {
        const wrapper = mountEmptyState({
            image: "empty-staff.svg",
            title: "Nenhum profissional cadastrado",
            description: "Cadastre o primeiro profissional para começar a atender.",
        });

        expect(wrapper.text()).toContain(
            "Cadastre o primeiro profissional para começar a atender.",
        );
    });

    it("should not render description element when omitted", () => {
        const wrapper = mountEmptyState({
            image: "empty-staff.svg",
            title: "Nenhum profissional cadastrado",
        });

        expect(wrapper.find(".empty-state__description").exists()).toBe(false);
    });
});
