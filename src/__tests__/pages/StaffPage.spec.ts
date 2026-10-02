import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import { defineComponent } from "vue";
import StaffPage from "../../pages/StaffPage.vue";
import EmptyState from "../../components/common/EmptyState.vue";
import ConfirmDialog from "../../components/common/ConfirmDialog.vue";
import StaffFormDialog from "../../components/forms/StaffFormDialog.vue";
import type { FetchParams, PaginatedResponse } from "../../domain/models/pagination";
import type {
    StaffMember,
    RegisterStaffPayload,
    UpdateStaffPayload,
    StaffRole,
} from "../../domain/models/Staff";
import {
    createMockStaff,
    createRegisterStaffPayload,
    createPaginatedStaff,
} from "../../test/factories/staffFactory";

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
const listMock = vi.fn<(params: FetchParams) => Promise<PaginatedResponse<StaffMember>>>();
const registerMock = vi.fn<(payload: RegisterStaffPayload) => Promise<void>>();
const updateMock = vi.fn<(id: string, payload: UpdateStaffPayload) => Promise<void>>();
const removeMock = vi.fn<(id: string) => Promise<void>>();

const SlotStub = defineComponent({
    name: "SlotStub",
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

const mountPage = () =>
    mount(StaffPage, {
        global: {
            stubs: {
                QDialog: SlotStub,
                QTooltip: SlotStub,
                QPage: SlotStub,
            },
        },
    });

const setupContainer = (response?: PaginatedResponse<StaffMember>) => {
    vi.mocked(container.resolve).mockReturnValue({
        list: listMock,
        getById: vi.fn<(id: string) => Promise<StaffMember>>(),
        register: registerMock,
        update: updateMock,
        remove: removeMock,
    });

    listMock.mockResolvedValue(response ?? createPaginatedStaff());
};

const findButtonByIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

describe("StaffPage", () => {
    const staff = createMockStaff();

    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;
        notifyMock.mockClear();
        listMock.mockReset();
        registerMock.mockReset().mockResolvedValue(undefined);
        updateMock.mockReset().mockResolvedValue(undefined);
        removeMock.mockReset().mockResolvedValue(undefined);
    });

    it("should load and render staff on mount", async () => {
        setupContainer(
            createPaginatedStaff({
                items: [staff, createMockStaff({ id: "staff-2", name: "Dra. Maria" })],
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
        expect(wrapper.text()).toContain(staff.name);
        expect(wrapper.text()).toContain("Dra. Maria");
    });

    it("should render empty state instead of table when list is empty", async () => {
        setupContainer(createPaginatedStaff({ items: [], totalCount: 0 }));
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);
        expect(wrapper.find('input[placeholder="Buscar..."]').exists()).toBe(false);
        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);
        expect(wrapper.text()).toContain("Nenhum profissional cadastrado");
    });

    it("should render table with role labels when list has results", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.findComponent(EmptyState).exists()).toBe(false);
        expect(wrapper.find("thead").exists()).toBe(true);
        expect(wrapper.text()).toContain("Veterinário");
    });

    it("should format phone number in table", async () => {
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
                message: "Erro ao carregar profissionais.",
            }),
        );
    });

    it("should open create dialog with null staff when new button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        const formDialog = wrapper.findComponent(StaffFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("staff")).toBeNull();
    });

    it("should open edit dialog populated when edit button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const formDialog = wrapper.findComponent(StaffFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("staff")).toMatchObject({
            id: staff.id,
            name: staff.name,
        });
    });

    it("should call register and notify on create submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(StaffFormDialog).props("modelValue")).toBe(true);

        const payload = createRegisterStaffPayload({ name: "Novo Prof" });
        await wrapper.findComponent(StaffFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(registerMock).toHaveBeenCalledWith(payload);
        expect(updateMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Profissional criado com sucesso!",
            }),
        );
        expect(wrapper.findComponent(StaffFormDialog).props("modelValue")).toBe(false);
    });

    it("should call update with selected staff id on edit submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const payload: UpdateStaffPayload = {
            name: "Dr. Editado",
            phoneNumber: "11900000000",
            birthDate: "1990-05-15",
            role: "Receptionist",
        };
        await wrapper.findComponent(StaffFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(updateMock).toHaveBeenCalledWith(staff.id, payload);
        expect(registerMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Profissional atualizado com sucesso!",
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
            .findComponent(StaffFormDialog)
            .vm.$emit("submit", createRegisterStaffPayload());
        await flushPromises();

        expect(listMock).toHaveBeenCalledTimes(1);
    });

    it("should notify error and keep dialog open when submit fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(StaffFormDialog).props("modelValue")).toBe(true);

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Já existe um usuário com esse e-mail."), {
                data: { errorMessage: "Já existe um usuário com esse e-mail." },
            }),
        );

        await wrapper
            .findComponent(StaffFormDialog)
            .vm.$emit("submit", createRegisterStaffPayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Já existe um usuário com esse e-mail.",
            }),
        );
        expect(wrapper.findComponent(StaffFormDialog).props("modelValue")).toBe(true);
    });

    it("should open delete dialog with staff name when delete is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain(staff.name);
    });

    it("should call remove with staff id and refresh on delete confirm", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(removeMock).toHaveBeenCalledWith(staff.id);
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Profissional excluído com sucesso!",
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
            Object.assign(new Error("Staff not found"), {
                data: { errorMessage: "Staff not found" },
            }),
        );

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Staff not found",
            }),
        );
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);
    });

    it("should render mobile card with staff data when in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const cardEdit = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "edit")!;
        await cardEdit.trigger("click");

        const formDialog = wrapper.findComponent(StaffFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("staff")).toMatchObject({ id: staff.id });

        await wrapper.findComponent(StaffFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        const cardDelete = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("icon") === "delete")!;
        await cardDelete.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain(staff.name);
    });

    it("should format landline phone with 10 digits", async () => {
        setupContainer(
            createPaginatedStaff({
                items: [createMockStaff({ phoneNumber: "1133334444" })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("(11) 3333-4444");
    });

    it("should render raw phone when digits length is unexpected", async () => {
        setupContainer(
            createPaginatedStaff({
                items: [createMockStaff({ phoneNumber: "123" })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("123");
    });

    it("should render raw role when unknown in table", async () => {
        setupContainer(
            createPaginatedStaff({
                items: [createMockStaff({ role: "UnknownRole" as StaffRole })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("UnknownRole");
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

    it("should not call remove when delete is confirmed without selection", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(removeMock).not.toHaveBeenCalled();
        expect(notifyMock).not.toHaveBeenCalled();
    });
});
