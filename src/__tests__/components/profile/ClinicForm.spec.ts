import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import ClinicForm from "../../../components/profile/ClinicForm.vue";
import type { Clinic, UpdateAccountPayload } from "../../../domain/models/Auth";
import { validationsMock } from "../../../test/mocks/useValidations";
import { createMockClinic } from "../../../test/factories/authFactory";
import { findInputByLabel, setInput, submitForm } from "../../../test/helpers/quasarUtils";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

const mountForm = (props: { clinic?: Clinic | null; isLoading?: boolean } = {}) =>
    mount(ClinicForm, {
        props: {
            clinic: createMockClinic(),
            isLoading: false,
            ...props,
        },
        global: {
            plugins: [Quasar],
        },
    });

describe("ClinicForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should populate form fields when clinic prop is provided", () => {
        const wrapper = mountForm();

        expect(findInputByLabel(wrapper, "Nome Fantasia")!.element.value).toBe("Pet Clinix");
        expect(findInputByLabel(wrapper, "Razão Social")!.element.value).toBe("Pet Clinix LTDA");
        expect(findInputByLabel(wrapper, "CNPJ")!.element.value).toBe("12.345.678/0001-99");
        expect(findInputByLabel(wrapper, "E-mail da Clínica")!.element.value).toBe(
            "clinic@petclinix.com",
        );
        expect(findInputByLabel(wrapper, "Telefone da Clínica")!.element.value).toBe(
            "(11) 98888-7777",
        );
        expect(findInputByLabel(wrapper, "CEP")!.element.value).toBe("01001-000");
        expect(findInputByLabel(wrapper, "Rua")!.element.value).toBe("Main Street");
        expect(findInputByLabel(wrapper, "Número")!.element.value).toBe("123");
        expect(findInputByLabel(wrapper, "Bairro")!.element.value).toBe("Center");
        expect(findInputByLabel(wrapper, "Complemento")!.element.value).toBe("Apt 1");
        expect(findInputByLabel(wrapper, "Cidade")!.element.value).toBe("Sao Paulo");
        expect(findInputByLabel(wrapper, "Estado")!.element.value).toBe("SP");
    });

    it("should render empty form when clinic is null", () => {
        const wrapper = mountForm({ clinic: null });

        expect(findInputByLabel(wrapper, "Nome Fantasia")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "E-mail da Clínica")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Cidade")!.element.value).toBe("");
    });

    it("should update form fields when clinic prop changes", async () => {
        const wrapper = mountForm({ clinic: null });

        await wrapper.setProps({ clinic: createMockClinic() });

        expect(findInputByLabel(wrapper, "Nome Fantasia")!.element.value).toBe("Pet Clinix");
        expect(findInputByLabel(wrapper, "Telefone da Clínica")!.element.value).toBe(
            "(11) 98888-7777",
        );
    });

    it("should pass isLoading to submit button", () => {
        const wrapper = mountForm({ isLoading: true });

        expect(wrapper.findComponent(QBtn).props("loading")).toBe(true);
    });

    it("should emit submit with clinic data", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await submitForm(wrapper);

        const emitted = wrapper.emitted("submit");
        expect(emitted).toHaveLength(1);

        const payload = emitted![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.clinicTradeName).toBe("Pet Clinix");
        expect(payload.clinicLegalName).toBe("Pet Clinix LTDA");
        expect(payload.clinicDocumentNumber).toBe("12345678000199");
        expect(payload.clinicEmail).toBe("clinic@petclinix.com");
        expect(payload.clinicPhoneNumber).toBe("11988887777");
        expect(payload.clinicZipCode).toBe("01001000");
        expect(payload.clinicStreet).toBe("Main Street");
        expect(payload.clinicNumber).toBe("123");
        expect(payload.clinicNeighborhood).toBe("Center");
        expect(payload.clinicComplement).toBe("Apt 1");
        expect(payload.clinicCity).toBe("Sao Paulo");
        expect(payload.clinicState).toBe("SP");
    });

    it("should not emit submit when required fields are empty", async () => {
        const wrapper = mountForm({ clinic: null });
        await flushPromises();

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not emit submit when clinic email is invalid", async () => {
        const wrapper = mountForm({ clinic: null });
        await flushPromises();

        await setInput(wrapper, "Nome Fantasia", "Pet Clinix");
        await setInput(wrapper, "Razão Social", "Pet Clinix LTDA");
        await setInput(wrapper, "CNPJ", "12345678000199");
        await setInput(wrapper, "E-mail da Clínica", "email_invalido");
        await setInput(wrapper, "Telefone da Clínica", "11988887777");
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

    it("should emit payload with all fields filled manually", async () => {
        const wrapper = mountForm({ clinic: null });
        await flushPromises();

        await setInput(wrapper, "Nome Fantasia", "Clinica Nova");
        await setInput(wrapper, "Razão Social", "Clinica Nova ME");
        await setInput(wrapper, "CNPJ", "98765432000155");
        await setInput(wrapper, "E-mail da Clínica", "contato@clinicanova.com");
        await setInput(wrapper, "Telefone da Clínica", "1133334444");
        await setInput(wrapper, "CEP", "04567890");
        await setInput(wrapper, "Rua", "Avenida Paulista");
        await setInput(wrapper, "Número", "1000");
        await setInput(wrapper, "Bairro", "Bela Vista");
        await setInput(wrapper, "Cidade", "Sao Paulo");
        await setInput(wrapper, "Estado", "SP");
        await setInput(wrapper, "Complemento", "Sala 10");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        const payload = wrapper.emitted("submit")![0][0] as Partial<UpdateAccountPayload>;
        expect(payload).toEqual({
            clinicTradeName: "Clinica Nova",
            clinicLegalName: "Clinica Nova ME",
            clinicDocumentNumber: "98765432000155",
            clinicEmail: "contato@clinicanova.com",
            clinicPhoneNumber: "1133334444",
            clinicZipCode: "04567890",
            clinicStreet: "Avenida Paulista",
            clinicNumber: "1000",
            clinicNeighborhood: "Bela Vista",
            clinicComplement: "Sala 10",
            clinicCity: "Sao Paulo",
            clinicState: "SP",
        });
    });

    it("should emit payload when user edits prefilled fields", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await setInput(wrapper, "Nome Fantasia", "Nome Editado");
        await setInput(wrapper, "Cidade", "Campinas");
        await setInput(wrapper, "Estado", "SP");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        const payload = wrapper.emitted("submit")![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.clinicTradeName).toBe("Nome Editado");
        expect(payload.clinicCity).toBe("Campinas");
        expect(payload.clinicEmail).toBe("clinic@petclinix.com");
    });

    it("should fall back to empty strings when clinic fields are missing", () => {
        const wrapper = mountForm({
            clinic: {} as Clinic,
        });

        expect(findInputByLabel(wrapper, "Nome Fantasia")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Razão Social")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "CNPJ")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "E-mail da Clínica")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Telefone da Clínica")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "CEP")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Rua")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Número")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Bairro")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Complemento")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Cidade")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Estado")!.element.value).toBe("");
    });
});
