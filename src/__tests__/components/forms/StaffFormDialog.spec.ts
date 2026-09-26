import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import { defineComponent } from "vue";
import StaffFormDialog from "../../../components/forms/StaffFormDialog.vue";
import type { StaffMember } from "../../../domain/models/Staff";
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

const mockStaff: StaffMember = {
    id: "staff-1",
    name: "Dr. João",
    email: "joao@petclinix.com",
    documentNumber: "12345678900",
    phoneNumber: "11999998888",
    birthDate: "1990-05-15",
    role: "Veterinarian",
    isActive: true,
};

const mountDialog = (
    props: { staff?: StaffMember | null; isLoading?: boolean } = {},
    modelValue = true,
) =>
    mount(StaffFormDialog, {
        props: {
            staff: null,
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

describe("StaffFormDialog", () => {
    it("should render create mode with empty form and default role", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Novo Profissional");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "CPF")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("");
    });

    it("should render edit mode with populated form", () => {
        const wrapper = mountDialog({ staff: mockStaff });

        expect(wrapper.text()).toContain("Editar Profissional");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Dr. João");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("joao@petclinix.com");
        expect(findInputByLabel(wrapper, "CPF")!.element.value).toBe("123.456.789-00");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("(11) 99999-8888");
        expect(findInputByLabel(wrapper, "Data de Nascimento")!.element.value).toBe("1990-05-15");
    });

    it("should show Save label in create mode and Update in edit mode", () => {
        const createWrapper = mountDialog();
        const editWrapper = mountDialog({ staff: mockStaff });

        const createSubmit = createWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;
        const editSubmit = editWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;

        expect(createSubmit.text()).toBe("Salvar");
        expect(editSubmit.text()).toBe("Atualizar");
    });

    it("should disable email and cpf inputs in edit mode", () => {
        const wrapper = mountDialog({ staff: mockStaff });

        expect(findInputByLabel(wrapper, "E-mail")!.attributes("disabled")).toBeDefined();
        expect(findInputByLabel(wrapper, "CPF")!.attributes("disabled")).toBeDefined();
        expect(findInputByLabel(wrapper, "Nome")!.attributes("disabled")).toBeUndefined();
        expect(findInputByLabel(wrapper, "Telefone")!.attributes("disabled")).toBeUndefined();
    });

    it("should enable email and cpf inputs in create mode", () => {
        const wrapper = mountDialog();

        expect(findInputByLabel(wrapper, "E-mail")!.attributes("disabled")).toBeUndefined();
        expect(findInputByLabel(wrapper, "CPF")!.attributes("disabled")).toBeUndefined();
    });

    it("should repopulate form when opened with a staff after being closed", async () => {
        const wrapper = mountDialog({ staff: null }, false);

        expect(findInputByLabel(wrapper, "Nome")).toBeUndefined();

        await wrapper.setProps({ modelValue: true, staff: mockStaff });

        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Dr. João");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("joao@petclinix.com");
    });

    it("should emit register payload with email and documentNumber in create mode", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Dra. Maria");
        await setInput(wrapper, "E-mail", "maria@petclinix.com");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11988887777");
        await setInput(wrapper, "Data de Nascimento", "1992-03-20");

        await submitThroughQForm(wrapper);

        expect(wrapper.emitted("submit")).toHaveLength(1);
        expect(wrapper.emitted("submit")![0]![0]).toEqual({
            name: "Dra. Maria",
            email: "maria@petclinix.com",
            documentNumber: "12345678900",
            phoneNumber: "11988887777",
            birthDate: "1992-03-20",
            role: "Receptionist",
        });
    });

    it("should emit update payload without email and documentNumber in edit mode", async () => {
        const wrapper = mountDialog({ staff: mockStaff });
        await flushPromises();

        await setInput(wrapper, "Nome", "Dr. João Editado");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.name).toBe("Dr. João Editado");
        expect(payload).not.toHaveProperty("email");
        expect(payload).not.toHaveProperty("documentNumber");
        expect(payload.role).toBe("Veterinarian");
    });

    it("should not emit submit when name is empty (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "E-mail", "maria@petclinix.com");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11988887777");
        await setInput(wrapper, "Data de Nascimento", "1992-03-20");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not emit submit when email is invalid (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Dra. Maria");
        await setInput(wrapper, "E-mail", "email_invalido");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11988887777");
        await setInput(wrapper, "Data de Nascimento", "1992-03-20");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not close dialog on submit (closing is the page's responsibility)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Dra. Maria");
        await setInput(wrapper, "E-mail", "maria@petclinix.com");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11988887777");
        await setInput(wrapper, "Data de Nascimento", "1992-03-20");

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

    it("should render nothing when parent closes the modal", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        expect(wrapper.text()).toContain("Novo Profissional");

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

    it("should emit register payload with selected role in create mode", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Dra. Maria");
        await setInput(wrapper, "E-mail", "maria@petclinix.com");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11988887777");
        await setInput(wrapper, "Data de Nascimento", "1992-03-20");

        wrapper.findComponent({ name: "QSelect" }).vm.$emit("update:modelValue", "Veterinarian");
        await flushPromises();

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.role).toBe("Veterinarian");
    });
});
