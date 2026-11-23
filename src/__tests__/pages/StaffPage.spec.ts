import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import StaffPage from "../../pages/StaffPage.vue";
import ListPageLayout from "../../components/common/ListPageLayout.vue";
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
import type { StaffLimit } from "../../domain/models/StaffLimit";
import type { PortalSession } from "../../domain/models/Billing";
import {
    createMockStaff,
    createRegisterStaffPayload,
    createPaginatedStaff,
    createStaffLimit,
} from "../../test/factories/staffFactory";
import { QDialogStub, QPageStub, QTooltipStub } from "../../test/helpers/stubs";
import { screenState } from "../../test/helpers/mockQuasar";

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../infrastructure/container";

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
const getByIdMock = vi.fn<(id: string) => Promise<StaffMember>>();
const registerMock = vi.fn<(payload: RegisterStaffPayload) => Promise<void>>();
const updateMock = vi.fn<(id: string, payload: UpdateStaffPayload) => Promise<void>>();
const removeMock = vi.fn<(id: string) => Promise<void>>();
const getStaffLimitMock = vi.fn<() => Promise<StaffLimit>>();
const createPortalSessionMock = vi.fn<(returnUrl: string) => Promise<PortalSession>>();

const mountPage = () =>
    mount(StaffPage, {
        global: {
            stubs: {
                QDialog: QDialogStub,
                QTooltip: QTooltipStub,
                QPage: QPageStub,
            },
        },
    });

const setupContainer = (response?: PaginatedResponse<StaffMember>) => {
    vi.mocked(container.resolve).mockImplementation((key: string) => {
        if (key === "BillingService") {
            return { createPortalSession: createPortalSessionMock };
        }
        return {
            list: listMock,
            getById: getByIdMock,
            register: registerMock,
            update: updateMock,
            remove: removeMock,
            getStaffLimit: getStaffLimitMock,
        };
    });

    listMock.mockResolvedValue(response ?? createPaginatedStaff());
};

const findButtonByIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

const originalLocation = window.location;

describe("StaffPage", () => {
    const staff = createMockStaff();

    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;
        notifyMock.mockClear();
        listMock.mockReset();
        getByIdMock.mockReset();
        registerMock.mockReset().mockResolvedValue(undefined);
        updateMock.mockReset().mockResolvedValue(undefined);
        removeMock.mockReset().mockResolvedValue(undefined);
        getStaffLimitMock.mockReset();
        createPortalSessionMock.mockReset();
    });

    afterEach(() => {
        Object.defineProperty(window, "location", { value: originalLocation, configurable: true });
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

    it("should show used and limit in page title when plan has a maximum", async () => {
        setupContainer();
        getStaffLimitMock.mockResolvedValue(createStaffLimit({ used: 2, limit: 5 }));

        const wrapper = mountPage();
        await flushPromises();

        expect(getStaffLimitMock).toHaveBeenCalledWith();
        expect(wrapper.findComponent(ListPageLayout).props("title")).toBe("Profissionais (2/5)");
    });

    it("should show page title without counter when plan is unlimited", async () => {
        setupContainer();
        getStaffLimitMock.mockResolvedValue(createStaffLimit({ limit: null }));

        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.findComponent(ListPageLayout).props("title")).toBe("Profissionais");
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

    it("should notify with upgrade action when register fails with staff limit reached", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Forbidden"), {
                data: {
                    errorCode: "identity.staff_limit_reached",
                    errorMessage: "Limite de profissionais do plano atingido.",
                },
            }),
        );

        await wrapper
            .findComponent(StaffFormDialog)
            .vm.$emit("submit", createRegisterStaffPayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Limite de profissionais do plano atingido.",
                timeout: 10000,
                actions: expect.arrayContaining([
                    expect.objectContaining({ label: "Fazer upgrade", color: "white" }),
                ]),
            }),
        );
    });

    it("should open billing portal when the upgrade action handler is invoked", async () => {
        setupContainer();
        createPortalSessionMock.mockResolvedValue({
            portalUrl: "https://billing.stripe.com/session/1",
        });
        Object.defineProperty(window, "location", {
            value: { href: "http://localhost:5173/staff" },
            configurable: true,
        });

        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Forbidden"), {
                data: {
                    errorCode: "identity.staff_limit_reached",
                    errorMessage: "Limite de profissionais do plano atingido.",
                },
            }),
        );

        await wrapper
            .findComponent(StaffFormDialog)
            .vm.$emit("submit", createRegisterStaffPayload());
        await flushPromises();

        const notifyPayload = notifyMock.mock.calls[0]![0];
        const actions = notifyPayload.actions as Array<{ label: string; handler: () => void }>;
        actions[0]!.handler();
        await flushPromises();

        expect(createPortalSessionMock).toHaveBeenCalledWith("http://localhost:5173/staff");
        expect(window.location.href).toBe("https://billing.stripe.com/session/1");
    });

    it("should notify with manage subscription action when register fails with inactive subscription", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Forbidden"), {
                data: {
                    errorCode: "identity.subscription_inactive",
                    errorMessage: "Assinatura inativa.",
                },
            }),
        );

        await wrapper
            .findComponent(StaffFormDialog)
            .vm.$emit("submit", createRegisterStaffPayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Assinatura inativa.",
                timeout: 10000,
                actions: expect.arrayContaining([
                    expect.objectContaining({ label: "Gerenciar assinatura", color: "white" }),
                ]),
            }),
        );
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

