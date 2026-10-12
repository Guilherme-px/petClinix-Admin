import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import {
    buildSlotOptions,
    createSlotController,
    type ScheduleSelection,
} from "../../composables/useAppointmentSlots";
import type { AppointmentService } from "../../application/services/appointmentService";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "../../domain/models/Appointment";
import { createMockAppointment } from "../../test/factories/appointmentFactory";

const baseSelection: ScheduleSelection = {
    veterinarianId: "vet-1",
    serviceId: "service-1",
    date: "2026-10-10",
};

const createServiceMock = () => ({
    listByRange: vi.fn<(startDate: string, endDate: string) => Promise<Appointment[]>>(),
    getById: vi.fn<(id: string) => Promise<Appointment>>(),
    register: vi.fn<(payload: RegisterAppointmentPayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: UpdateAppointmentPayload) => Promise<void>>(),
    updateStatus: vi.fn<(id: string, status: string) => Promise<void>>(),
    getAvailableSlots:
        vi.fn<(vetId: string, serviceId: string, date: string) => Promise<string[]>>(),
});

describe("buildSlotOptions", () => {
    it("should map slots to sorted options", () => {
        const result = buildSlotOptions(["10:00", "08:00", "09:00"], null, baseSelection);

        expect(result).toEqual([
            { label: "08:00", value: "08:00" },
            { label: "09:00", value: "09:00" },
            { label: "10:00", value: "10:00" },
        ]);
    });

    it("should merge the current appointment slot when schedule is unchanged", () => {
        const appointment = createMockAppointment();

        const result = buildSlotOptions(["08:00", "09:00"], appointment, baseSelection);

        expect(result.map((o) => o.value)).toEqual(["08:00", "09:00", "10:30"]);
    });

    it("should not duplicate the current slot when it is already available", () => {
        const appointment = createMockAppointment();

        const result = buildSlotOptions(["08:00", "10:30"], appointment, baseSelection);

        expect(result.filter((o) => o.value === "10:30")).toHaveLength(1);
    });

    it.each([
        { field: "veterinarianId", value: "vet-2" },
        { field: "serviceId", value: "service-2" },
        { field: "date", value: "2026-10-11" },
    ])("should drop the current slot when $field changes", ({ field, value }) => {
        const appointment = createMockAppointment();

        const result = buildSlotOptions(["08:00"], appointment, {
            ...baseSelection,
            [field]: value,
        });

        expect(result.map((o) => o.value)).not.toContain("10:30");
    });

    it("should not merge when there is no appointment in edit", () => {
        const result = buildSlotOptions(["08:00"], null, baseSelection);

        expect(result.map((o) => o.value)).toEqual(["08:00"]);
    });

    it("should not merge when the appointment has no scheduled time", () => {
        const appointment = createMockAppointment({ scheduledTime: "" });

        const result = buildSlotOptions(["08:00"], appointment, baseSelection);

        expect(result.map((o) => o.value)).toEqual(["08:00"]);
    });
});

describe("createSlotController", () => {
    const setupController = (
        resolved: string[] | Error,
        selectionValues: ScheduleSelection = baseSelection,
        appointment: Appointment | null = null,
    ) => {
        const serviceMock = createServiceMock();
        if (resolved instanceof Error) {
            serviceMock.getAvailableSlots.mockRejectedValue(resolved);
        } else {
            serviceMock.getAvailableSlots.mockResolvedValue(resolved);
        }

        const selection = ref<ScheduleSelection>(selectionValues);
        const controller = createSlotController(
            serviceMock as AppointmentService,
            selection,
            () => appointment,
        );

        return { serviceMock, selection, controller };
    };

    it("should start with empty options and no loading", () => {
        const { controller } = setupController([]);

        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
        expect(controller.canLoad.value).toBe(true);
    });

    it.each([
        { field: "veterinarianId", value: "" },
        { field: "serviceId", value: "" },
        { field: "date", value: "" },
    ])("should expose canLoad false when $field is missing", ({ field, value }) => {
        const { controller } = setupController([], { ...baseSelection, [field]: value });

        expect(controller.canLoad.value).toBe(false);
    });

    it("should react when selection becomes complete", async () => {
        const { selection, controller, serviceMock } = setupController([], {
            veterinarianId: "",
            serviceId: "",
            date: "",
        });

        expect(controller.canLoad.value).toBe(false);

        selection.value = baseSelection;
        await controller.load();

        expect(controller.canLoad.value).toBe(true);
        expect(serviceMock.getAvailableSlots).toHaveBeenCalledWith(
            "vet-1",
            "service-1",
            "2026-10-10",
        );
    });

    it("should clear options without calling the service when selection is incomplete", async () => {
        const { controller, serviceMock } = setupController([], {
            ...baseSelection,
            date: "",
        });

        await controller.load();

        expect(serviceMock.getAvailableSlots).not.toHaveBeenCalled();
        expect(controller.options.value).toEqual([]);
    });

    it("should load slots and build options merging the current appointment", async () => {
        const appointment = createMockAppointment();
        const { controller, serviceMock } = setupController(
            ["09:00", "08:00"],
            baseSelection,
            appointment,
        );

        await controller.load();

        expect(serviceMock.getAvailableSlots).toHaveBeenCalledWith(
            "vet-1",
            "service-1",
            "2026-10-10",
        );
        expect(controller.options.value.map((o) => o.value)).toEqual(["08:00", "09:00", "10:30"]);
        expect(controller.loading.value).toBe(false);
    });

    it("should toggle loading during the fetch", async () => {
        let resolveFetch!: (value: string[]) => void;
        const serviceMock = createServiceMock();
        serviceMock.getAvailableSlots.mockReturnValue(
            new Promise<string[]>((resolve) => (resolveFetch = resolve)),
        );
        const selection = ref<ScheduleSelection>(baseSelection);
        const controller = createSlotController(
            serviceMock as AppointmentService,
            selection,
            () => null,
        );

        const pending = controller.load();
        expect(controller.loading.value).toBe(true);

        resolveFetch(["08:00"]);
        await pending;

        expect(controller.loading.value).toBe(false);
    });

    it("should clear options and reset loading when the service fails", async () => {
        const { controller } = setupController(new Error("Network Error"));

        await controller.load();

        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
    });
});
