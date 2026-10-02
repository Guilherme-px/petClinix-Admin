import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import { defineComponent, h } from "vue";
import TutorPage from "../../pages/TutorPage.vue";
import ConfirmDialog from "../../components/common/ConfirmDialog.vue";
import TutorFormDialog from "../../components/forms/TutorFormDialog.vue";
import type { FetchParams, PaginatedResponse } from "../../domain/models/pagination";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "../../domain/models/Tutor";
import {
    createMockTutor,
    createRegisterTutorPayload,
    createPaginatedTutors,
} from "../../test/factories/tutorFactory";

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../infrastructure/container";

const screenState = { lt: { sm: false } };

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: () => ({
            notify: notifyMock,
            screen: screenState,
        }),
    };
});

const notifyMock = vi.fn<(opts: Record<string, unknown>) => void>();
const listMock = vi.fn<(params: FetchParams) => Promise<PaginatedResponse<Tutor>>>();
const getByIdMock = vi.fn<(id: string) => Promise<Tutor>>();
const registerMock = vi.fn<(payload: RegisterTutorPayload) => Promise<void>>();
const updateMock = vi.fn<(id: string, payload: UpdateTutorPayload) => Promise<void>>();
const removeMock = vi.fn<(id: string) => Promise<void>>();

const SlotStub = defineComponent({
    name: "SlotStub",
    inheritAttrs: false,
    setup(_, { slots }) {
        return () => h("div", slots.default?.());
    },
});

const QDialogStub = defineComponent({
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

const QExpansionItemStub = defineComponent({
    name: "QExpansionItemStub",
    props: { label: { type: String, default: "" } },
    setup(props, { slots }) {
        return () => h("div", [h("div", props.label), slots.default?.()]);
    },
});

const mountPage = () =>
    mount(TutorPage, {
        global: {
            stubs: {
                QDialog: QDialogStub,
                QTooltip: SlotStub,
                QPage: SlotStub,
                QExpansionItem: QExpansionItemStub,
            },
        },
    });

const setupContainer = (response?: PaginatedResponse<Tutor>) => {
    vi.mocked(container.resolve).mockReturnValue({
        list: listMock,
        getById: getByIdMock,
        register: registerMock,
        update: updateMock,
        remove: removeMock,
    });

    listMock.mockResolvedValue(response ?? createPaginatedTutors());
};

const findButtonByIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

describe("TutorPage", () => {
    const tutor = createMockTutor();

    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;
        notifyMock.mockClear();
        listMock.mockReset();
        getByIdMock.mockReset();
        registerMock.mockReset().mockResolvedValue(undefined);
        updateMock.mockReset().mockResolvedValue(undefined);
        removeMock.mockReset().mockResolvedValue(undefined);
    });

    it("should load and render tutors on mount", async () => {
        setupContainer(
            createPaginatedTutors({
                items: [tutor, createMockTutor({ id: "tutor-2", name: "Carlos Pereira" })],
                totalCount: 2,
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(listMock).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 10,
            search: "",
        });
        expect(wrapper.text()).toContain(tutor.name);
        expect(wrapper.text()).toContain("Carlos Pereira");
    });

    it("should render formatted cpf in table", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("123.456.789-00");
    });

    it("should render formatted phone in table", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("(11) 99999-8888");
    });

    it("should notify error when loading fails", async () => {
        setupContainer();
        listMock.mockRejectedValue(new Error("Network Error"));

        mountPage();
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao carregar tutores.",
            }),
        );
    });

    it("should open create dialog with null tutor when new button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        const formDialog = wrapper.findComponent(TutorFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("tutor")).toBeNull();
    });

    it("should open edit dialog with row data when edit button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const formDialog = wrapper.findComponent(TutorFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("tutor")).toMatchObject({
            id: tutor.id,
            name: tutor.name,
        });
    });

    it("should call register and notify on create submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(TutorFormDialog).props("modelValue")).toBe(true);

        const payload = createRegisterTutorPayload({ name: "Novo Tutor" });
        await wrapper.findComponent(TutorFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(registerMock).toHaveBeenCalledWith(payload);
        expect(updateMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Tutor criado com sucesso!",
            }),
        );
        expect(wrapper.findComponent(TutorFormDialog).props("modelValue")).toBe(false);
    });

    it("should call update with selected tutor id on edit submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const payload: UpdateTutorPayload = {
            name: "Tutor Editado",
            email: null,
            phoneNumber: "11900000000",
            secondaryPhoneNumber: null,
            zipCode: "01001000",
            street: "Rua Atualizada",
            number: "789",
            neighborhood: "Center",
            complement: null,
            city: "Sao Paulo",
            state: "SP",
            notes: null,
        };
        await wrapper.findComponent(TutorFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(updateMock).toHaveBeenCalledWith(tutor.id, payload);
        expect(registerMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Tutor atualizado com sucesso!",
            }),
        );
    });

    it("should refresh table after successful submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();
        listMock.mockClear();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        await wrapper
            .findComponent(TutorFormDialog)
            .vm.$emit("submit", createRegisterTutorPayload());
        await flushPromises();

        expect(listMock).toHaveBeenCalledTimes(1);
    });

    it("should notify error and keep dialog open when submit fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(TutorFormDialog).props("modelValue")).toBe(true);

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Já existe um usuário com esse CPF."), {
                data: { errorMessage: "Já existe um usuário com esse CPF." },
            }),
        );

        await wrapper
            .findComponent(TutorFormDialog)
            .vm.$emit("submit", createRegisterTutorPayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Já existe um usuário com esse CPF.",
            }),
        );
        expect(wrapper.findComponent(TutorFormDialog).props("modelValue")).toBe(true);
    });

    it("should open delete dialog with tutor name when delete is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain(tutor.name);
    });

    it("should call remove with tutor id and refresh on delete confirm", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(removeMock).toHaveBeenCalledWith(tutor.id);
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Tutor excluído com sucesso!",
            }),
        );
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(false);
        expect(listMock).toHaveBeenCalledTimes(2);
    });

    it("should notify error and keep delete dialog open when removal fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        removeMock.mockRejectedValueOnce(
            Object.assign(new Error("Tutor not found"), {
                data: { errorMessage: "Tutor not found" },
            }),
        );

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Tutor not found",
            }),
        );
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);
    });

    it("should not call remove when delete is confirmed without selection", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(removeMock).not.toHaveBeenCalled();
    });

    it("should close delete dialog when it emits update:modelValue (cancel / ESC / backdrop)", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(ConfirmDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(false);
    });

    it("should render mobile card with tutor data when in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain(tutor.name);
        expect(cardText).toContain("123.456.789-00");
        expect(cardText).toContain("maria@teste.com");
        expect(cardText).toContain("Sao Paulo/SP");
        expect(cardText).toContain("(11) 99999-8888");

        const cardEdit = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "edit")!;
        await cardEdit.trigger("click");

        const formDialog = wrapper.findComponent(TutorFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("tutor")).toMatchObject({ id: tutor.id });

        await wrapper.findComponent(TutorFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        const cardDelete = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("icon") === "delete")!;
        await cardDelete.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain(tutor.name);
    });

    it("should hide email line in mobile card when tutor has no email", async () => {
        screenState.lt.sm = true;
        setupContainer(
            createPaginatedTutors({
                items: [createMockTutor({ email: null })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain(tutor.name);
        expect(cardText).not.toContain("maria@teste.com");
    });
});
