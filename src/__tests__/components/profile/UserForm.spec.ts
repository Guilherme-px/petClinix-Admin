import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import UserForm from "../../../components/profile/UserForm.vue";
import type { User, UpdateAccountPayload } from "../../../domain/models/Auth";
import { validationsMock } from "../../../test/mocks/useValidations";
import { createMockUser } from "../../../test/factories/authFactory";
import { findInputByLabel, setInput, submitForm } from "../../../test/helpers/quasarUtils";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

const mountForm = (props: { user?: User | null; isLoading?: boolean } = {}) =>
    mount(UserForm, {
        props: {
            user: createMockUser(),
            isLoading: false,
            ...props,
        },
        global: {
            plugins: [Quasar],
        },
    });

describe("UserForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should populate form fields when user prop is provided", () => {
        const wrapper = mountForm();

        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("John Doe");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("(11) 99999-8888");
        expect(findInputByLabel(wrapper, "Data de Nascimento")!.element.value).toBe("1990-01-01");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("john@petclinix.com");
        expect(findInputByLabel(wrapper, "CPF")!.element.value).toBe("123.456.789-00");
    });

    it("should render empty form when user is null", () => {
        const wrapper = mountForm({ user: null });

        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "E-mail")!.element.value).toBe("");
    });

    it("should update form fields when user prop changes", async () => {
        const wrapper = mountForm({ user: null });

        await wrapper.setProps({ user: createMockUser() });

        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("John Doe");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("(11) 99999-8888");
    });

    it("should disable email and CPF inputs", () => {
        const wrapper = mountForm();

        expect(findInputByLabel(wrapper, "E-mail")!.attributes("disabled")).toBeDefined();
        expect(findInputByLabel(wrapper, "CPF")!.attributes("disabled")).toBeDefined();
    });

    it("should pass isLoading to submit button", () => {
        const wrapper = mountForm({ isLoading: true });

        expect(wrapper.findComponent(QBtn).props("loading")).toBe(true);
    });

    it("should render password inputs masked by default", () => {
        const wrapper = mountForm();

        expect(findInputByLabel(wrapper, "Nova Senha")!.attributes("type")).toBe("password");
        expect(findInputByLabel(wrapper, "Confirmar Nova Senha")!.attributes("type")).toBe(
            "password",
        );
    });

    it("should toggle password visibility on icon click", async () => {
        const wrapper = mountForm();

        const toggleIcon = wrapper.find(".q-icon.cursor-pointer");
        const newPassword = findInputByLabel(wrapper, "Nova Senha")!;
        const confirmPassword = findInputByLabel(wrapper, "Confirmar Nova Senha")!;

        await toggleIcon.trigger("click");
        expect(newPassword.attributes("type")).toBe("text");
        expect(confirmPassword.attributes("type")).toBe("text");

        await toggleIcon.trigger("click");
        expect(newPassword.attributes("type")).toBe("password");
        expect(confirmPassword.attributes("type")).toBe("password");
    });

    it("should emit submit with user data and without newPassword when password is empty", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await submitForm(wrapper);

        const emitted = wrapper.emitted("submit");
        expect(emitted).toHaveLength(1);

        const payload = emitted![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.userName).toBe("John Doe");
        expect(payload.userPhoneNumber).toBe("11999998888");
        expect(payload.userBirthDate).toBe("1990-01-01");
        expect(payload).not.toHaveProperty("newPassword");
    });

    it("should not emit submit when passwords do not match", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await setInput(wrapper, "Nova Senha", "Password@123");
        await setInput(wrapper, "Confirmar Nova Senha", "Different@123");

        await submitForm(wrapper);

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should emit submit with newPassword when passwords match", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await setInput(wrapper, "Nova Senha", "Password@123");
        await setInput(wrapper, "Confirmar Nova Senha", "Password@123");

        await submitForm(wrapper);

        const payload = wrapper.emitted("submit")![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.newPassword).toBe("Password@123");
        expect(payload.userName).toBe("John Doe");
    });

    it("should not emit submit when required fields are empty", async () => {
        const wrapper = mountForm({ user: null });
        await flushPromises();

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should emit submit when required fields are filled", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toHaveLength(1);
    });

    it("should emit payload with all fields filled manually", async () => {
        const wrapper = mountForm({ user: null });
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "Jane Doe");
        await setInput(wrapper, "Telefone", "11888887777");
        await setInput(wrapper, "Data de Nascimento", "1995-05-05");
        await setInput(wrapper, "Nova Senha", "Password@123");
        await setInput(wrapper, "Confirmar Nova Senha", "Password@123");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        const payload = wrapper.emitted("submit")![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.userName).toBe("Jane Doe");
        expect(payload.userPhoneNumber).toBe("11888887777");
        expect(payload.userBirthDate).toBe("1995-05-05");
        expect(payload.newPassword).toBe("Password@123");
    });

    it("should emit payload when user edits prefilled fields", async () => {
        const wrapper = mountForm();
        await flushPromises();

        await setInput(wrapper, "Nome Completo", "John Edited");
        await setInput(wrapper, "Telefone", "11777776666");
        await setInput(wrapper, "Data de Nascimento", "1992-02-02");

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        const payload = wrapper.emitted("submit")![0][0] as Partial<UpdateAccountPayload>;
        expect(payload.userName).toBe("John Edited");
        expect(payload.userPhoneNumber).toBe("11777776666");
        expect(payload.userBirthDate).toBe("1992-02-02");
        expect(payload).not.toHaveProperty("newPassword");
    });

    it("should fall back to empty strings when user fields are missing", () => {
        const wrapper = mountForm({
            user: createMockUser({ name: undefined, phoneNumber: undefined, birthDate: undefined }),
        });

        expect(findInputByLabel(wrapper, "Nome Completo")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Telefone")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Data de Nascimento")!.element.value).toBe("");
    });
});
