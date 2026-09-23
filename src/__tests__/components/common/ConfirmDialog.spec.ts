import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import { defineComponent } from "vue";
import ConfirmDialog from "../../../components/common/ConfirmDialog.vue";

const QDialogStub = defineComponent({
    name: "QDialogStub",
    props: { modelValue: { type: Boolean, default: false } },
    emits: ["update:modelValue"],
    setup(props, { slots }) {
        return () => (props.modelValue ? slots.default?.() : null);
    },
});

const mountDialog = (
    props: {
        title?: string;
        message?: string;
        icon?: string;
        confirmLabel?: string;
        confirmColor?: string;
        loading?: boolean;
    } = {},
    modelValue = true,
) =>
    mount(ConfirmDialog, {
        props: {
            title: "Excluir registro",
            message: "Deseja realmente excluir? Esta ação não pode ser desfeita.",
            modelValue,
            ...props,
        },
        global: {
            plugins: [Quasar],
            stubs: { QDialog: QDialogStub },
        },
    });

describe("ConfirmDialog", () => {
    it("should render title, message and default button labels when open", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Excluir registro");
        expect(wrapper.text()).toContain(
            "Deseja realmente excluir? Esta ação não pode ser desfeita.",
        );

        const buttons = wrapper.findAll("button");
        expect(buttons).toHaveLength(2);
        expect(buttons[0]!.text()).toBe("Cancelar");
        expect(buttons[1]!.text()).toBe("Confirmar");
    });

    it("should render banner with default icon and color", () => {
        const wrapper = mountDialog();

        const banner = wrapper.find(".confirm-dialog__banner");
        expect(banner.exists()).toBe(true);
        expect(banner.classes()).toContain("bg-primary");

        const icon = banner.find(".q-icon");
        expect(icon.exists()).toBe(true);
        expect(icon.text()).toContain("help");
    });

    it("should render custom icon and banner color", () => {
        const wrapper = mountDialog({ icon: "delete_forever", confirmColor: "negative" });

        const banner = wrapper.find(".confirm-dialog__banner");
        expect(banner.classes()).toContain("bg-negative");

        const icon = banner.find(".q-icon");
        expect(icon.text()).toContain("delete_forever");
    });

    it("should render nothing when closed", () => {
        const wrapper = mountDialog({}, false);

        expect(wrapper.findAll("button")).toHaveLength(0);
        expect(wrapper.text()).not.toContain("Excluir registro");
    });

    it("should use custom confirm label and color", () => {
        const wrapper = mountDialog({ confirmLabel: "Excluir", confirmColor: "negative" });

        const confirmButton = wrapper.findAll("button")[1]!;
        expect(confirmButton.text()).toBe("Excluir");
        expect(wrapper.findAllComponents(QBtn)[1]!.props("color")).toBe("negative");
    });

    it("should emit confirm when confirm button is clicked", async () => {
        const wrapper = mountDialog();

        await wrapper.findAll("button")[1]!.trigger("click");

        expect(wrapper.emitted("confirm")).toHaveLength(1);
        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("should not emit confirm when cancel button is clicked", async () => {
        const wrapper = mountDialog();

        await wrapper.findAll("button")[0]!.trigger("click");

        expect(wrapper.emitted("confirm")).toBeUndefined();
    });

    it("should disable cancel button when loading", () => {
        const wrapper = mountDialog({ loading: true });

        const cancelButton = wrapper.findAll("button")[0]!;
        expect(cancelButton.attributes("disabled")).toBeDefined();

        const confirmButton = wrapper.findAllComponents(QBtn)[1]!;
        expect(confirmButton.props("loading")).toBe(true);
    });

    it("should not disable buttons by default", () => {
        const wrapper = mountDialog();

        const cancelButton = wrapper.findAll("button")[0]!;
        expect(cancelButton.attributes("disabled")).toBeUndefined();

        const confirmButton = wrapper.findAllComponents(QBtn)[1]!;
        expect(confirmButton.props("loading")).toBe(false);
    });

    it("should propagate dialog close event to parent via model", async () => {
        const wrapper = mountDialog();

        wrapper.findComponent(QDialogStub).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        expect(wrapper.emitted("update:modelValue")![0]).toEqual([false]);
    });
});
