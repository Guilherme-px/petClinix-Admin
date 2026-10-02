import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import TutorFormDialog from "../../../components/forms/TutorFormDialog.vue";
import type { Tutor } from "../../../domain/models/Tutor";
import { validationsMock } from "../../../test/mocks/useValidations";
import { findInputByLabel, setInput } from "../../../test/helpers/quasarUtils";
import { QDialogStub, QExpansionItemStub } from "../../../test/helpers/stubs";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

const mockTutor: Tutor = {
    id: "tutor-1",
    name: "Maria Souza",
    cpf: "12345678900",
    email: "maria@teste.com",
    phoneNumber: "11999998888",
    secondaryPhoneNumber: "11988887777",
    zipCode: "01001000",
    street: "Main Street",
    number: "123",
    neighborhood: "Center",
    complement: "Apto 1",
    city: "Sao Paulo",
    state: "SP",
    notes: "Cliente antigo",
    isActive: true,
};

const mountDialog = (
    props: { tutor?: Tutor | null; isLoading?: boolean } = {},
    modelValue = true,
) =>
    mount(TutorFormDialog, {
        props: {
            tutor: null,
            isLoading: false,
            modelValue,
            ...props,
        },
        global: {
            stubs: {
                QDialog: QDialogStub,
                QExpansionItem: QExpansionItemStub,
            },
        },
    });

const submitThroughQForm = async (wrapper: ReturnType<typeof mountDialog>) => {
    wrapper.findComponent({ name: "QForm" }).vm.$emit("submit");
    await flushPromises();
};

const fillAllFields = async (wrapper: ReturnType<typeof mountDialog>) => {
    await setInput(wrapper, "Nome Completo", "Maria Souza");
    await setInput(wrapper, "CPF", "12345678900");
    await setInput(wrapper, "Telefone", "11999998888");
    await setInput(wrapper, "CEP", "01001000");
    await setInput(wrapper, "Rua", "Main Street");
    await setInput(wrapper, "Número", "123");
    await setInput(wrapper, "Bairro", "Center");
    await setInput(wrapper, "Cidade", "Sao Paulo");
    await setInput(wrapper, "Estado", "SP");
};

describe("TutorFormDialog", () => {
    it("should render create mode with empty form", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Novo Tutor");
        expect(wrapper.text()).toContain("Dados Pessoais");
        expect(wrapper.text()).toContain("Endereço");
        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "CPF")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "CEP")!.element.value).toBe("");
    });

    it("should render edit mode with populated form", () => {
        const wrapper = mountDialog({ tutor: mockTutor });

        expect(wrapper.text()).toContain("Editar Tutor");
        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("Maria Souza");
        expect(findInputByLabel(wrapper, "CPF")!.element.value).toBe("123.456.789-00");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("maria@teste.com");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("(11) 99999-8888");
        expect(findInputByLabel(wrapper, "Telefone Secundário")!.element.value).toBe(
            "(11) 98888-7777",
        );
        expect(findInputByLabel(wrapper, "CEP")!.element.value).toBe("01001-000");
        expect(findInputByLabel(wrapper, "Rua")!.element.value).toBe("Main Street");
        expect(findInputByLabel(wrapper, "Número")!.element.value).toBe("123");
        expect(findInputByLabel(wrapper, "Cidade")!.element.value).toBe("Sao Paulo");
        expect(findInputByLabel(wrapper, "Estado")!.element.value).toBe("SP");
    });

    it("should show Save label in create mode and Update in edit mode", () => {
        const createWrapper = mountDialog();
        const editWrapper = mountDialog({ tutor: mockTutor });

        const createSubmit = createWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;
        const editSubmit = editWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;

        expect(createSubmit.text()).toBe("Salvar");
        expect(editSubmit.text()).toBe("Atualizar");
    });

    it("should disable cpf input in edit mode", () => {
        const wrapper = mountDialog({ tutor: mockTutor });

        expect(findInputByLabel(wrapper, "CPF")!.attributes("disabled")).toBeDefined();
        expect(findInputByLabel(wrapper, "Nome Completo")!.attributes("disabled")).toBeUndefined();
    });

    it("should enable cpf input in create mode", () => {
        const wrapper = mountDialog();

        expect(findInputByLabel(wrapper, "CPF")!.attributes("disabled")).toBeUndefined();
    });

    it("should repopulate form when opened with a tutor after being closed", async () => {
        const wrapper = mountDialog({ tutor: null }, false);

        expect(findInputByLabel(wrapper, "Nome Completo")).toBeUndefined();

        await wrapper.setProps({ modelValue: true, tutor: mockTutor });

        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("Maria Souza");
        expect(findInputByLabel(wrapper, "Rua")!.element.value).toBe("Main Street");
    });

    it("should emit register payload with cpf and null optionals in create mode", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await fillAllFields(wrapper);

        await submitThroughQForm(wrapper);

        expect(wrapper.emitted("submit")).toHaveLength(1);
        expect(wrapper.emitted("submit")![0]![0]).toEqual({
            name: "Maria Souza",
            cpf: "12345678900",
            email: null,
            phoneNumber: "11999998888",
            secondaryPhoneNumber: null,
            zipCode: "01001000",
            street: "Main Street",
            number: "123",
            neighborhood: "Center",
            complement: null,
            city: "Sao Paulo",
            state: "SP",
            notes: null,
        });
    });

    it("should emit update payload without cpf in edit mode", async () => {
        const wrapper = mountDialog({ tutor: mockTutor });
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "Maria Editada");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.name).toBe("Maria Editada");
        expect(payload).not.toHaveProperty("cpf");
        expect(payload.email).toBe("maria@teste.com");
        expect(payload.complement).toBe("Apto 1");
    });

    it("should trim filled optional fields in payload", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "Maria Souza");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11999998888");
        await setInput(wrapper, "Telefone Secundário", "11977776666");
        await setInput(wrapper, "E-mail", "  maria@teste.com  ");
        await setInput(wrapper, "Complemento", "  Casa  ");
        await setInput(wrapper, "Observações", "  Nota  ");
        await setInput(wrapper, "CEP", "01001000");
        await setInput(wrapper, "Rua", "Main Street");
        await setInput(wrapper, "Número", "123");
        await setInput(wrapper, "Bairro", "Center");
        await setInput(wrapper, "Cidade", "Sao Paulo");
        await setInput(wrapper, "Estado", "SP");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.email).toBe("maria@teste.com");
        expect(payload.complement).toBe("Casa");
        expect(payload.notes).toBe("Nota");
        expect(payload.secondaryPhoneNumber).toBe("11977776666");
    });

    it("should not emit submit when name is empty (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await fillAllFields(wrapper);
        await setInput(wrapper, "Nome Completo", "");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not emit submit when cpf is invalid (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "Maria Souza");
        await setInput(wrapper, "CPF", "123");
        await setInput(wrapper, "Telefone", "11999998888");
        await setInput(wrapper, "CEP", "01001000");
        await setInput(wrapper, "Rua", "Main Street");
        await setInput(wrapper, "Número", "123");
        await setInput(wrapper, "Bairro", "Center");
        await setInput(wrapper, "Cidade", "Sao Paulo");
        await setInput(wrapper, "Estado", "SP");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not emit submit when cep is invalid (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "Maria Souza");
        await setInput(wrapper, "CPF", "12345678900");
        await setInput(wrapper, "Telefone", "11999998888");
        await setInput(wrapper, "CEP", "0100");
        await setInput(wrapper, "Rua", "Main Street");
        await setInput(wrapper, "Número", "123");
        await setInput(wrapper, "Bairro", "Center");
        await setInput(wrapper, "Cidade", "Sao Paulo");
        await setInput(wrapper, "Estado", "SP");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not close dialog on submit (closing is the page's responsibility)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await fillAllFields(wrapper);

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

        expect(wrapper.text()).toContain("Novo Tutor");

        await wrapper.setProps({ modelValue: false });
        await flushPromises();

        expect(findInputByLabel(wrapper, "Nome Completo")).toBeUndefined();
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
