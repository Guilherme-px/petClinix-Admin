import { defineComponent, h } from "vue";

export const SlotStub = defineComponent({
    name: "SlotStub",
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => h("div", slots.default?.());
    },
});

export const QDialogStub = defineComponent({
    name: "QDialogStub",
    inheritAttrs: false,
    props: {
        modelValue: { type: Boolean, default: false },
        persistent: { type: Boolean, default: false },
    },
    emits: ["update:modelValue"],
    setup(props, { slots }) {
        return () => (props.modelValue ? slots.default?.() : null);
    },
});

export const QTooltipStub = defineComponent({
    name: "QTooltipStub",
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

export const QPageStub = defineComponent({
    name: "QPageStub",
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

export const QExpansionItemStub = defineComponent({
    name: "QExpansionItemStub",
    inheritAttrs: false,
    props: { label: { type: String, default: "" } },
    setup(props, { slots }) {
        return () => h("div", [h("div", props.label), slots.default?.()]);
    },
});
