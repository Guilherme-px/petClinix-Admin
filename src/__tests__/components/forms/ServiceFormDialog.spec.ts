import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import { defineComponent } from "vue";
import ServiceFormDialog from "../../../components/forms/ServiceFormDialog.vue";
import type { VeterinaryService } from "../../../domain/models/VeterinaryService";
import { validationsMock } from "../../../test/mocks/useValidations";
import { findInputByLabel, setInput } from "../../../test/helpers/quasarUtils";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

const QDialogStub = defineComponent({
    name: "QDialogStub",
    props: { modelValue: { type: Boolean, default: false } },
    emits: ["update:modelValue"],
    setup(props, { slots }) {
        return () => (props.modelValue ? slots.default?.() : null);
    },
});

const QTooltipStub = defineComponent({
    name: "QTooltipStub",
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

const mockService: VeterinaryService = {
    id: "service-1",
    name: "Banho e Tosa",
    description: "Higiene completa",
    durationInMinutes: 60,
    price: 90,
    requiresVeterinarian: false,
};

const mountDialog = (
    props: { service?: VeterinaryService | null; isLoading?: boolean } = {},
    modelValue = true,
) =>
    mount(ServiceFormDialog, {
        props: {
            service: null,
            isLoading: false,
            modelValue,
            ...props,
        },
        global: {
            plugins: [Quasar],
            stubs: { QDialog: QDialogStub, QTooltip: QTooltipStub },
        },
    });

const submitThroughQForm = async (wrapper: ReturnType<typeof mountDialog>) => {
    wrapper.findComponent({ name: "QForm" }).vm.$emit("submit");
    await flushPromises();
};

describe("ServiceFormDialog", () => {
    it("should render create mode with empty form and default duration", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Novo Serviço");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Duração (min)")!.element.value).toBe("0");
        expect(findInputByLabel(wrapper, "Preço (R$)")!.element.value).toBe("0");
        expect(findInputByLabel(wrapper, "Descrição")!.element.value).toBe("");
    });

    it("should render edit mode with populated form", () => {
        const wrapper = mountDialog({ service: mockService });

        expect(wrapper.text()).toContain("Editar Serviço");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Banho e Tosa");
        expect(findInputByLabel(wrapper, "Duração (min)")!.element.value).toBe("60");
        expect(findInputByLabel(wrapper, "Preço (R$)")!.element.value).toBe("90");
        expect(findInputByLabel(wrapper, "Descrição")!.element.value).toBe("Higiene completa");
    });

    it("should show Save label in create mode and Update in edit mode", () => {
        const createWrapper = mountDialog();
        const editWrapper = mountDialog({ service: mockService });

        const createSubmit = createWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;
        const editSubmit = editWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;

        expect(createSubmit.text()).toBe("Salvar");
        expect(editSubmit.text()).toBe("Atualizar");
    });

    it("should repopulate form when opened with a service after being closed", async () => {
        const wrapper = mountDialog({ service: null }, false);

        expect(findInputByLabel(wrapper, "Nome")).toBeUndefined();

        await wrapper.setProps({ modelValue: true, service: mockService });

        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Banho e Tosa");
        expect(findInputByLabel(wrapper, "Duração (min)")!.element.value).toBe("60");
        expect(findInputByLabel(wrapper, "Preço (R$)")!.element.value).toBe("90");
    });

    it("should emit submit with payload and null description when empty", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Consulta");
        await setInput(wrapper, "Duração (min)", "30");
        await setInput(wrapper, "Preço (R$)", "150");

        await submitThroughQForm(wrapper);

        expect(wrapper.emitted("submit")).toHaveLength(1);
        expect(wrapper.emitted("submit")![0]![0]).toEqual({
            name: "Consulta",
            description: null,
            durationInMinutes: 30,
            price: 150,
            requiresVeterinarian: false,
        });
    });

    it("should trim description when filled", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Consulta");
        await setInput(wrapper, "Descrição", "  Avaliação clínica  ");
        await setInput(wrapper, "Duração (min)", "30");
        await setInput(wrapper, "Preço (R$)", "150");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as { description: string | null };
        expect(payload.description).toBe("Avaliação clínica");
    });

    it("should emit requiresVeterinarian true when toggle is clicked", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Consulta");
        await setInput(wrapper, "Duração (min)", "30");
        await setInput(wrapper, "Preço (R$)", "150");

        await wrapper.find(".q-toggle").trigger("click");
        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as {
            requiresVeterinarian: boolean;
        };
        expect(payload.requiresVeterinarian).toBe(true);
    });

    it("should not emit submit when name is empty (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Duração (min)", "30");
        await setInput(wrapper, "Preço (R$)", "150");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not emit submit when price is zero (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Consulta");
        await setInput(wrapper, "Duração (min)", "30");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not close dialog on submit (closing is the page's responsibility)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Consulta");
        await setInput(wrapper, "Duração (min)", "30");
        await setInput(wrapper, "Preço (R$)", "150");

        await submitThroughQForm(wrapper);

        expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    });

    it("should show loading state on submit button and disable cancel", () => {
        const wrapper = mountDialog({ isLoading: true });

        const submitBtn = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;
        const cancelBtn = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("label") === "Cancelar")!;

        expect(submitBtn.props("loading")).toBe(true);
        expect(cancelBtn.props("disable")).toBe(true);
    });

    it("should render info icon on veterinarian toggle", () => {
        const wrapper = mountDialog();

        const infoIcon = wrapper.find(".q-icon");
        expect(infoIcon.exists()).toBe(true);
        expect(wrapper.text()).toContain("Requer veterinário");
    });

    it("should render veterinarian agenda hint text", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Desmarque quando o serviço não ocupar tempo da agenda");
    });

    it("should render nothing when parent closes the modal", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        expect(wrapper.text()).toContain("Novo Serviço");

        await wrapper.setProps({ modelValue: false });
        await flushPromises();

        expect(findInputByLabel(wrapper, "Nome")).toBeUndefined();
    });

    it("should propagate dialog close event to parent (ESC / backdrop / v-close-popup)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        wrapper.findComponent(QDialogStub).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")).toBeTruthy();
        expect(wrapper.emitted("update:modelValue")![0]).toEqual([false]);
    });
});
