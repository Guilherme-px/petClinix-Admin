import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import AppointmentsPage from "../../pages/AppointmentsPage.vue";
import AppointmentDetailDialog from "../../components/appointments/AppointmentDetailDialog.vue";
import AppointmentFormDialog from "../../components/forms/AppointmentFormDialog.vue";
import type {
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "../../domain/models/Appointment";
import {
    createAppointmentServiceMock,
    createPetServiceMock,
    createStaffServiceMock,
    createTutorServiceMock,
    createCatalogServiceMock,
} from "../../test/mocks/services";
import { createMockAppointment } from "../../test/factories/appointmentFactory";
import { createMockPet, createPaginatedPets } from "../../test/factories/petFactory";
import { screenState } from "../../test/helpers/mockQuasar";
import { QDialogStub, QTooltipStub, QPageStub } from "../../test/helpers/stubs";

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

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

vi.mock("@fullcalendar/vue3", async () => {
    const { defineComponent, h } = await import("vue");

    const FullCalendarStub = defineComponent({
        name: "FullCalendar",
        props: { options: { type: Object, default: () => ({}) } },
        setup(_, { expose }) {
            expose({
                getApi: () => ({
                    view: {
                        activeStart: new Date(2026, 9, 1),
                        activeEnd: new Date(2026, 10, 1),
                    },
                }),
            });
            return () => h("div", { "data-test": "fullcalendar-stub" });
        },
    });

    return { default: FullCalendarStub };
});

import { container } from "../../infrastructure/container";

const appointment = createMockAppointment();

const appointmentServiceMock = createAppointmentServiceMock();
const petServiceMock = createPetServiceMock();
const staffServiceMock = createStaffServiceMock();
const tutorServiceMock = createTutorServiceMock();
const catalogServiceMock = createCatalogServiceMock();

const mountPage = () =>
    mount(AppointmentsPage, {
        global: {
            stubs: {
                QDialog: QDialogStub,
                QTooltip: QTooltipStub,
                QPage: QPageStub,
            },
        },
    });

const findCalendar = (wrapper: ReturnType<typeof mountPage>) =>
    wrapper.findComponent({ name: "FullCalendar" });

const triggerDatesSet = async (wrapper: ReturnType<typeof mountPage>, start: Date, end: Date) => {
    const options = findCalendar(wrapper).props("options") as {
        datesSet: (info: { start: Date; end: Date }) => void;
    };
    options.datesSet({ start, end });
    await flushPromises();
};

const triggerEventClick = async (wrapper: ReturnType<typeof mountPage>, id: string) => {
    const options = findCalendar(wrapper).props("options") as {
        eventClick: (info: { event: { id: string } }) => void;
    };
    options.eventClick({ event: { id } });
    await flushPromises();
};

const findButtonByIcon = (wrapper: ReturnType<typeof mountPage>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

describe("AppointmentsPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;

        vi.mocked(container.resolve).mockImplementation((key: string) => {
            if (key === "AppointmentService") return appointmentServiceMock;
            if (key === "PetService") return petServiceMock;
            if (key === "StaffService") return staffServiceMock;
            if (key === "TutorService") return tutorServiceMock;
            if (key === "CatalogService") return catalogServiceMock;
            return undefined;
        });

        appointmentServiceMock.listByRange.mockResolvedValue([appointment]);
        staffServiceMock.list.mockResolvedValue({
            items: [
                {
                    id: "vet-1",
                    name: "Dr. João",
                    role: "Veterinarian",
                    isActive: true,
                    email: "vet@petclinix.com",
                    documentNumber: "1",
                    phoneNumber: "1",
                    birthDate: "1990-01-01",
                },
            ],
            totalCount: 1,
            pageNumber: 1,
            pageSize: 100,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
        });
        tutorServiceMock.list.mockResolvedValue({
            items: [
                {
                    id: "tutor-1",
                    name: "Guilherme",
                    cpf: "1",
                    email: null,
                    phoneNumber: "11999998888",
                    secondaryPhoneNumber: null,
                    zipCode: "1",
                    street: "1",
                    number: "1",
                    neighborhood: "1",
                    complement: null,
                    city: "1",
                    state: "1",
                    notes: null,
                    isActive: true,
                },
            ],
            totalCount: 1,
            pageNumber: 1,
            pageSize: 100,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
        });
        catalogServiceMock.list.mockResolvedValue({
            items: [
                {
                    id: "service-1",
                    name: "Consulta",
                    description: null,
                    durationInMinutes: 30,
                    price: 100,
                    requiresVeterinarian: true,
                },
            ],
            totalCount: 1,
            pageNumber: 1,
            pageSize: 100,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
        });
        petServiceMock.list.mockResolvedValue(
            createPaginatedPets({
                items: [createMockPet({ id: "pet-1", name: "Rex" })],
                totalCount: 1,
            }),
        );
    });

    it("should load lookups on mount", async () => {
        mountPage();
        await flushPromises();

        const expectedParams = { pageNumber: 1, pageSize: 100, search: "" };
        expect(staffServiceMock.list).toHaveBeenCalledWith(expectedParams);
        expect(tutorServiceMock.list).toHaveBeenCalledWith(expectedParams);
        expect(catalogServiceMock.list).toHaveBeenCalledWith(expectedParams);
    });

    it("should render legend and calendar shell", () => {
        const wrapper = mountPage();

        expect(wrapper.find(".calendar-shell").exists()).toBe(true);
        expect(wrapper.find(".status-legend").exists()).toBe(true);
        expect(wrapper.findAll(".status-legend__item").length).toBeGreaterThan(0);
    });

    it("should notify error when lookups fail on mount", async () => {
        staffServiceMock.list.mockRejectedValue(new Error("fail"));

        mountPage();
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao carregar dados para agendamento.",
            }),
        );
    });

    it("should load range with exclusive end adjusted by one day on datesSet", async () => {
        const wrapper = mountPage();
        await flushPromises();

        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));

        expect(appointmentServiceMock.listByRange).toHaveBeenCalledWith("2026-10-01", "2026-10-31");
    });

    it("should notify error when range load fails", async () => {
        const wrapper = mountPage();
        await flushPromises();
        appointmentServiceMock.listByRange.mockRejectedValue(new Error("fail"));

        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao carregar agendamentos.",
            }),
        );
    });

    it("should open detail dialog with the appointment on event click", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));

        await triggerEventClick(wrapper, appointment.id);

        const detail = wrapper.findComponent(AppointmentDetailDialog);
        expect(detail.exists()).toBe(true);
        expect(detail.props("modelValue")).toBe(true);
        expect(detail.props("appointment")).toMatchObject({ id: appointment.id });
    });

    it("should not open detail dialog for unknown event id", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));

        await triggerEventClick(wrapper, "unknown-id");

        expect(wrapper.findComponent(AppointmentDetailDialog).exists()).toBe(false);
    });

    it("should open create dialog with null appointment and refresh lookups", async () => {
        const wrapper = mountPage();
        await flushPromises();
        staffServiceMock.list.mockClear();

        await findButtonByIcon(wrapper, "add")!.trigger("click");

        const form = wrapper.findComponent(AppointmentFormDialog);
        expect(form.props("modelValue")).toBe(true);
        expect(form.props("appointment")).toBeNull();
        expect(staffServiceMock.list).toHaveBeenCalled();
    });

    it("should open form populated when edit is emitted from detail", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        await triggerEventClick(wrapper, appointment.id);

        await wrapper.findComponent(AppointmentDetailDialog).vm.$emit("edit");
        await flushPromises();

        expect(wrapper.findComponent(AppointmentDetailDialog).props("modelValue")).toBe(false);
        const form = wrapper.findComponent(AppointmentFormDialog);
        expect(form.props("modelValue")).toBe(true);
        expect(form.props("appointment")).toMatchObject({ id: appointment.id });
    });

    it("should register, notify, close form and refresh calendar on create submit", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        appointmentServiceMock.listByRange.mockClear();

        const payload: RegisterAppointmentPayload = {
            tutorId: "tutor-1",
            petId: "pet-1",
            serviceId: "service-1",
            veterinarianId: "vet-1",
            date: "2026-10-10",
            time: "10:00",
            notes: null,
        };
        await wrapper.findComponent(AppointmentFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(appointmentServiceMock.register).toHaveBeenCalledWith(payload);
        expect(appointmentServiceMock.update).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Agendamento salvo com sucesso!",
            }),
        );
        expect(wrapper.findComponent(AppointmentFormDialog).props("modelValue")).toBe(false);
        expect(appointmentServiceMock.listByRange).toHaveBeenCalledTimes(1);
    });

    it("should update with selected appointment id on edit submit", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        await triggerEventClick(wrapper, appointment.id);

        const payload: UpdateAppointmentPayload = {
            veterinarianId: "vet-1",
            serviceId: "service-1",
            date: "2026-10-11",
            time: "14:00",
            notes: null,
        };
        await wrapper.findComponent(AppointmentFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(appointmentServiceMock.update).toHaveBeenCalledWith(appointment.id, payload);
        expect(appointmentServiceMock.register).not.toHaveBeenCalled();
    });

    it("should notify error and keep form open when submit fails", async () => {
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "add")!.trigger("click");
        expect(wrapper.findComponent(AppointmentFormDialog).props("modelValue")).toBe(true);

        appointmentServiceMock.register.mockRejectedValue(new Error("fail"));

        const payload: RegisterAppointmentPayload = {
            tutorId: "tutor-1",
            petId: "pet-1",
            serviceId: "service-1",
            veterinarianId: "vet-1",
            date: "2026-10-10",
            time: "10:00",
            notes: null,
        };
        await wrapper.findComponent(AppointmentFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao salvar agendamento.",
            }),
        );
        expect(wrapper.findComponent(AppointmentFormDialog).props("modelValue")).toBe(true);
    });

    it("should cancel appointment, notify and refresh on detail cancel", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        await triggerEventClick(wrapper, appointment.id);
        appointmentServiceMock.listByRange.mockClear();

        await wrapper.findComponent(AppointmentDetailDialog).vm.$emit("cancel");
        await flushPromises();

        expect(appointmentServiceMock.updateStatus).toHaveBeenCalledWith(
            appointment.id,
            "Canceled",
        );
        expect(wrapper.findComponent(AppointmentDetailDialog).props("modelValue")).toBe(false);
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({ type: "positive", message: "Agendamento cancelado!" }),
        );
        expect(appointmentServiceMock.listByRange).toHaveBeenCalledTimes(1);
    });

    it("should notify error and keep detail open when cancel fails", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        await triggerEventClick(wrapper, appointment.id);
        appointmentServiceMock.updateStatus.mockRejectedValue(new Error("fail"));

        await wrapper.findComponent(AppointmentDetailDialog).vm.$emit("cancel");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao cancelar agendamento.",
            }),
        );
        expect(wrapper.findComponent(AppointmentDetailDialog).props("modelValue")).toBe(true);
    });

    it("should close detail dialog when it emits update:modelValue", async () => {
        const wrapper = mountPage();
        await flushPromises();
        await triggerDatesSet(wrapper, new Date(2026, 9, 1), new Date(2026, 10, 1));
        await triggerEventClick(wrapper, appointment.id);
        expect(wrapper.findComponent(AppointmentDetailDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(AppointmentDetailDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(AppointmentDetailDialog).props("modelValue")).toBe(false);
    });

    it("should close form dialog when it emits update:modelValue", async () => {
        const wrapper = mountPage();
        await flushPromises();

        await findButtonByIcon(wrapper, "add")!.trigger("click");
        expect(wrapper.findComponent(AppointmentFormDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(AppointmentFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(AppointmentFormDialog).props("modelValue")).toBe(false);
    });

    it("should toggle calendar loading overlay via the loading callback", async () => {
        const wrapper = mountPage();
        await flushPromises();

        const options = findCalendar(wrapper).props("options") as {
            loading: (isLoading: boolean) => void;
        };

        options.loading(true);
        await flushPromises();
        expect(wrapper.find(".calendar-loading").exists()).toBe(true);

        options.loading(false);
        await flushPromises();
        expect(wrapper.find(".calendar-loading").exists()).toBe(false);
    });

    it("should skip refresh when calendar api is not available", async () => {
        const wrapper = mountPage();
        await flushPromises();
        appointmentServiceMock.listByRange.mockClear();

        const vm = wrapper.vm as unknown as {
            calendarRef: unknown;
            refreshCalendar: () => void;
        };
        vm.calendarRef = null;
        vm.refreshCalendar();

        expect(appointmentServiceMock.listByRange).not.toHaveBeenCalled();
    });

    it("should guard cancel when there is no selected appointment", async () => {
        const wrapper = mountPage();
        await flushPromises();

        const vm = wrapper.vm as unknown as { onCancelAppointment: () => Promise<void> };
        await vm.onCancelAppointment();

        expect(appointmentServiceMock.updateStatus).not.toHaveBeenCalled();
        expect(notifyMock).not.toHaveBeenCalled();
    });
});
