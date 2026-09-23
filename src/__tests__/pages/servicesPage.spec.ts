import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QBtn } from "quasar";
import { defineComponent } from "vue";
import ServicesPage from "../../pages/ServicesPage.vue";
import ConfirmDialog from "../../components/common/ConfirmDialog.vue";
import ServiceFormDialog from "../../components/forms/ServiceFormDialog.vue";
import type { FetchParams, PaginatedResponse } from "../../domain/models/pagination";
import type { ServicePayload, VeterinaryService } from "../../domain/models/VeterinaryService";
import {
    createMockService,
    createServicePayload,
    createPaginatedServices,
} from "../../test/factories/catalogFactory";

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "@/infrastructure/container";

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
const listMock = vi.fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>();
const registerMock = vi.fn<(payload: ServicePayload) => Promise<void>>();
const updateMock = vi.fn<(id: string, payload: ServicePayload) => Promise<void>>();
const removeMock = vi.fn<(id: string) => Promise<void>>();

const SlotStub = defineComponent({
    name: "SlotStub",
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

const mountPage = () =>
    mount(ServicesPage, {
        global: {
            plugins: [Quasar],
            stubs: {
                QDialog: SlotStub,
                QTooltip: SlotStub,
                QPage: SlotStub,
            },
        },
    });

const setupContainer = (response?: PaginatedResponse<VeterinaryService>) => {
    vi.mocked(container.resolve).mockReturnValue({
        list: listMock,
        register: registerMock,
        update: updateMock,
        remove: removeMock,
    });

    listMock.mockResolvedValue(response ?? createPaginatedServices());
};

const findButtonByIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

describe("ServicesPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;
        notifyMock.mockClear();
        listMock.mockReset();
        registerMock.mockReset().mockResolvedValue(undefined);
        updateMock.mockReset().mockResolvedValue(undefined);
        removeMock.mockReset().mockResolvedValue(undefined);
    });

    it("should load and render services on mount", async () => {
        setupContainer(
            createPaginatedServices({
                items: [
                    createMockService(),
                    createMockService({ id: "service-2", name: "Consulta" }),
                ],
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
        expect(wrapper.text()).toContain("Banho e Tosa");
        expect(wrapper.text()).toContain("Consulta");
    });

    it("should show empty state when api returns no services", async () => {
        setupContainer(createPaginatedServices({ items: [], totalCount: 0 }));
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("Nenhum registro encontrado");
    });

    it("should notify error when loading fails", async () => {
        listMock.mockRejectedValue(new Error("Network Error"));
        setupContainer();
        listMock.mockRejectedValueOnce(new Error("Network Error"));

        mountPage();
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "negative", message: "Erro ao carregar serviços." }),
        );
    });

    it("should format price as BRL currency", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const text = wrapper.text();
        expect(text).toContain("90,00");
        expect(wrapper.text().replace(/\u00A0/g, " ")).toContain("R$ 90,00");
    });

    it("should format duration in hours when 60 minutes or more", async () => {
        setupContainer(
            createPaginatedServices({
                items: [createMockService({ durationInMinutes: 90 })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("1h 30min");
    });

    it("should show placeholder when description is empty", async () => {
        setupContainer(
            createPaginatedServices({
                items: [createMockService({ description: null })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("—");
    });

    it("should open create dialog with empty form when new button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        const formDialog = wrapper.findComponent(ServiceFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("service")).toBeNull();
    });

    it("should open edit dialog populated when edit button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const editButton = findButtonByIcon(wrapper, "edit")!;
        await editButton.trigger("click");

        const formDialog = wrapper.findComponent(ServiceFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("service")).toMatchObject({
            id: "service-1",
            name: "Banho e Tosa",
        });
    });

    it("should call register and notify on create submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("submit", createServicePayload());
        await flushPromises();

        expect(registerMock).toHaveBeenCalledWith(createServicePayload());
        expect(updateMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Serviço criado com sucesso!",
            }),
        );
    });

    it("should close form dialog after successful submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("submit", createServicePayload());
        await flushPromises();

        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(false);
    });

    it("should refresh table after successful create", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();
        listMock.mockClear();

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("submit", createServicePayload());
        await flushPromises();

        expect(listMock).toHaveBeenCalledTimes(1);
    });

    it("should call update with selected service id on edit submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "edit")!.trigger("click");
        await wrapper
            .findComponent(ServiceFormDialog)
            .vm.$emit("submit", createServicePayload({ name: "Editado" }));
        await flushPromises();

        expect(updateMock).toHaveBeenCalledWith(
            "service-1",
            createServicePayload({ name: "Editado" }),
        );
        expect(registerMock).not.toHaveBeenCalled();
    });

    it("should notify error and keep dialog open when submit fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(true);

        registerMock.mockRejectedValueOnce(
            Object.assign(new Error("Name already exists"), {
                data: { errorMessage: "Name already exists" },
            }),
        );

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("submit", createServicePayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Name already exists",
            }),
        );
        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(true);
    });

    it("should open delete dialog with service name when delete is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain("Banho e Tosa");
    });

    it("should call remove with service id and refresh on delete confirm", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(removeMock).toHaveBeenCalledWith("service-1");
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Serviço excluído com sucesso!",
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
            Object.assign(new Error("Service not found"), {
                data: { errorMessage: "Service not found" },
            }),
        );

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Service not found",
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

    it("should render mobile card with formatted data and actions when in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer(
            createPaginatedServices({
                items: [createMockService({ durationInMinutes: 90, description: null })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);

        const cardText = wrapper.find(".q-card").text();
        expect(cardText.replace(/\u00A0/g, " ")).toContain("R$ 90,00");
        expect(cardText).toContain("1h 30min");
        expect(cardText).toContain("Sem veterinário");

        const cardEdit = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "edit")!;
        await cardEdit.trigger("click");

        const formDialog = wrapper.findComponent(ServiceFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("service")).toMatchObject({ id: "service-1" });

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        const cardDelete = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("icon") === "delete")!;
        await cardDelete.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain("Banho e Tosa");
    });

    it("should sync modal state when dialogs are closed by their own events", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("icon") === "add")!
            .trigger("click");
        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(ServiceFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(ServiceFormDialog).props("modelValue")).toBe(false);

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(ConfirmDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(false);
    });

    it("should format all duration branches and Sim flag in table", async () => {
        setupContainer(
            createPaginatedServices({
                items: [
                    createMockService({ id: "1", name: "Zero", durationInMinutes: 0 }),
                    createMockService({ id: "2", name: "Curto", durationInMinutes: 30 }),
                    createMockService({ id: "3", name: "Hora exata", durationInMinutes: 60 }),
                    createMockService({ id: "4", name: "Misto", durationInMinutes: 90 }),
                    createMockService({ id: "5", name: "Com vet", requiresVeterinarian: true }),
                ],
                totalCount: 5,
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.text()).toContain("Sem duração fixa");
        expect(wrapper.text()).toContain("30 min");
        expect(wrapper.text()).toContain("1h");
        expect(wrapper.text()).toContain("1h 30min");
        expect(wrapper.text()).toContain("Sim");
    });

    it("should render card with description and required veterinarian in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer(
            createPaginatedServices({
                items: [
                    createMockService({
                        description: "Texto completo",
                        requiresVeterinarian: true,
                        durationInMinutes: 0,
                    }),
                ],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain("Texto completo");
        expect(cardText).toContain("Requer veterinário");
        expect(cardText).toContain("Sem duração fixa");
    });
});
