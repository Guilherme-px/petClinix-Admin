import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { QForm } from "quasar";
import type { DOMWrapper } from "@vue/test-utils";

export const findInputByLabel = (
    wrapper: VueWrapper,
    label: string,
): DOMWrapper<HTMLInputElement | HTMLTextAreaElement> | undefined => {
    const field = wrapper
        .findAll(".q-field")
        .find((f) => f.findAll(".q-field__label").some((l) => l.text() === label));
    return field?.find("input, textarea");
};

export const setInput = async (wrapper: VueWrapper, label: string, value: string) => {
    await findInputByLabel(wrapper, label)!.setValue(value);
};

export const submitForm = async (wrapper: VueWrapper) => {
    wrapper.findComponent(QForm).vm.$emit("submit", new Event("submit"));
    await flushPromises();
};
