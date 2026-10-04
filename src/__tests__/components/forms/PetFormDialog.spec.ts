import { describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import PetFormDialog from "../../../components/forms/PetFormDialog.vue";
import type { Pet } from "../../../domain/models/Pet";
import { validationsMock } from "../../../test/mocks/useValidations";
import { findInputByLabel, setInput } from "../../../test/helpers/quasarUtils";
import { QDialogStub, QTooltipStub } from "../../../test/helpers/stubs";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

const mockPet: Pet = {
    id: "pet-1",
    name: "Rex",
    species: "Dog",
    breed: "Vira Lata",
    birthDate: "2020-05-10",
    sex: "Male",
    weight: 15.5,
    isNeutered: true,
    notes: "Agressivo com outros machos",
};

const mountDialog = (props: { pet?: Pet | null; isLoading?: boolean } = {}, modelValue = true) =>
    mount(PetFormDialog, {
        props: {
            pet: null,
            isLoading: false,
            modelValue,
            ...props,
        },
        global: {
            stubs: { QDialog: QDialogStub, QTooltip: QTooltipStub },
        },
    });

const submitThroughQForm = async (wrapper: ReturnType<typeof mountDialog>) => {
    wrapper.findComponent({ name: "QForm" }).vm.$emit("submit");
    await flushPromises();
};

describe("PetFormDialog", () => {
    it("should render create mode with empty form", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Novo Pet");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Raça")!.element.value).toBe("");
        expect(findInputByLabel(wrapper, "Peso (kg)")!.element.value).toBe("");
    });

    it("should render edit mode with populated form", () => {
        const wrapper = mountDialog({ pet: mockPet });

        expect(wrapper.text()).toContain("Editar Pet");
        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Rex");
        expect(findInputByLabel(wrapper, "Raça")!.element.value).toBe("Vira Lata");
        expect(findInputByLabel(wrapper, "Peso (kg)")!.element.value).toBe("15.5");
        expect(findInputByLabel(wrapper, "Data de Nascimento")!.element.value).toBe("2020-05-10");
    });

    it("should show Save label in create mode and Update in edit mode", () => {
        const createWrapper = mountDialog();
        const editWrapper = mountDialog({ pet: mockPet });

        const createSubmit = createWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;
        const editSubmit = editWrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("type") === "submit")!;

        expect(createSubmit.text()).toBe("Salvar");
        expect(editSubmit.text()).toBe("Atualizar");
    });

    it("should repopulate form when opened with a pet after being closed", async () => {
        const wrapper = mountDialog({ pet: null }, false);

        expect(findInputByLabel(wrapper, "Nome")).toBeUndefined();

        await wrapper.setProps({ modelValue: true, pet: mockPet });

        expect(findInputByLabel(wrapper, "Nome")!.element.value).toBe("Rex");
        expect(findInputByLabel(wrapper, "Raça")!.element.value).toBe("Vira Lata");
    });

    it("should emit full payload in create mode with trimmed optional fields", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Bolinha");
        await setInput(wrapper, "Raça", "  SRD  ");
        await setInput(wrapper, "Peso (kg)", "5.5");
        await setInput(wrapper, "Observações", "  Nota  ");

        await submitThroughQForm(wrapper);

        expect(wrapper.emitted("submit")).toHaveLength(1);
        expect(wrapper.emitted("submit")![0]![0]).toEqual({
            name: "Bolinha",
            species: "Dog",
            breed: "SRD",
            birthDate: null,
            sex: "Male",
            weight: 5.5,
            isNeutered: false,
            notes: "Nota",
        });
    });

    it("should emit update payload in edit mode", async () => {
        const wrapper = mountDialog({ pet: mockPet });
        await flushPromises();

        await setInput(wrapper, "Nome", "Rex Editado");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.name).toBe("Rex Editado");
        expect(payload.species).toBe("Dog");
        expect(payload.weight).toBe(15.5);
    });

    it("should not emit submit when name is empty (validation)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await wrapper.find("form").trigger("submit");
        await flushPromises();

        expect(wrapper.emitted("submit")).toBeUndefined();
    });

    it("should not close dialog on submit (closing is the page's responsibility)", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Bolinha");

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

        expect(wrapper.text()).toContain("Novo Pet");

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

    it("should emit payload with fields set from selects, date and toggle", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setInput(wrapper, "Nome", "Mingau");

        const selects = wrapper.findAllComponents({ name: "QSelect" });
        selects[0]!.vm.$emit("update:modelValue", "Cat");
        selects[1]!.vm.$emit("update:modelValue", "Female");

        await setInput(wrapper, "Data de Nascimento", "2021-08-20");

        wrapper.findComponent({ name: "QToggle" }).vm.$emit("update:modelValue", true);
        await flushPromises();

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")![0]![0] as Record<string, unknown>;
        expect(payload.species).toBe("Cat");
        expect(payload.sex).toBe("Female");
        expect(payload.birthDate).toBe("2021-08-20");
        expect(payload.isNeutered).toBe(true);
    });
});
