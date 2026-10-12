import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import {
    formatDateKey,
    buildCalendarEvents,
    createAppointmentsCalendar,
} from "../../composables/useAppointmentsCalendar";
import { createAppointmentServiceMock } from "../../test/mocks/services";
import { createMockAppointment, createMockAppointments } from "../../test/factories/appointmentFactory";

describe("formatDateKey", () => {
    it("should format with zero padding", () => {
        expect(formatDateKey(new Date(2026, 9, 8))).toBe("2026-10-08");
    });

    it("should handle year and month boundaries", () => {
        expect(formatDateKey(new Date(2026, 0, 1))).toBe("2026-01-01");
        expect(formatDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
    });
});

describe("buildCalendarEvents", () => {
    it("should title event with dash and veterinarian name when found", () => {
        const appointment = createMockAppointment();
        const event = buildCalendarEvents([appointment], [{ id: "vet-1", name: "Dr. João" }])[0]!;

        expect(event.title).toBe("- Dr. João");
    });

    it("should fall back to status label when veterinarian is not in the lookup", () => {
        const event = buildCalendarEvents([createMockAppointment()], [])[0]!;

        expect(event.title).toBe("Agendado");
    });

    it("should build start from scheduled date and time", () => {
        const event = buildCalendarEvents([createMockAppointment()], [])[0]!;

        expect(event.start).toBe("2026-10-10T10:30:00");
    });

    it("should paint event with the status color on all color props", () => {
        const event = buildCalendarEvents(
            [createMockAppointment({ status: "Canceled" })],
            [],
        )[0]!;

        expect(event.color).toBe("#F44336");
        expect(event.backgroundColor).toBe("#F44336");
        expect(event.borderColor).toBe("#F44336");
    });

    it("should carry the raw status in extendedProps", () => {
        const event = buildCalendarEvents([createMockAppointment()], [])[0]!;

        expect(event.extendedProps.status).toBe("Scheduled");
    });

    it("should use the vet matching each appointment veterinarian id", () => {
        const appointments = createMockAppointments(2).map((a, i) => ({
            ...a,
            veterinarianId: i === 0 ? "vet-1" : "vet-2",
        }));
        const events = buildCalendarEvents(appointments, [
            { id: "vet-1", name: "Dr. João" },
            { id: "vet-2", name: "Dra. Maria" },
        ]);

        expect(events[0]!.title).toBe("- Dr. João");
        expect(events[1]!.title).toBe("- Dra. Maria");
    });
});

describe("createAppointmentsCalendar", () => {
    const setup = (resolved: Appointment[] | Error) => {
        const serviceMock = createAppointmentServiceMock();
        if (resolved instanceof Error) {
            serviceMock.listByRange.mockRejectedValue(resolved);
        } else {
            serviceMock.listByRange.mockResolvedValue(resolved);
        }
        const onError = vi.fn<(error: unknown) => void>();
        const calendar = createAppointmentsCalendar(serviceMock, onError);
        return { serviceMock, onError, calendar };
    };

    it("should start with empty state and no loading", () => {
        const { calendar } = setup([]);

        expect(calendar.appointments.value).toEqual([]);
        expect(calendar.events.value).toEqual([]);
        expect(calendar.isLoading.value).toBe(false);
    });

    it("should load range with exclusive end adjusted by one day", async () => {
        const { serviceMock, calendar } = setup([createMockAppointment()]);

        await calendar.loadRange(new Date(2026, 9, 1), new Date(2026, 10, 1));

        expect(serviceMock.listByRange).toHaveBeenCalledWith("2026-10-01", "2026-10-31");
        expect(calendar.appointments.value).toHaveLength(1);
        expect(calendar.events.value).toHaveLength(1);
        expect(calendar.isLoading.value).toBe(false);
    });

    it("should toggle loading during the fetch", async () => {
        const serviceMock = createAppointmentServiceMock();
        let resolveFetch!: (value: Appointment[]) => void;
        serviceMock.listByRange.mockReturnValue(
            new Promise<Appointment[]>((resolve) => (resolveFetch = resolve)),
        );
        const calendar = createAppointmentsCalendar(serviceMock, vi.fn());

        const pending = calendar.loadRange(new Date(2026, 9, 1), new Date(2026, 10, 1));
        expect(calendar.isLoading.value).toBe(true);

        resolveFetch([]);
        await pending;

        expect(calendar.isLoading.value).toBe(false);
    });

    it("should notify error and reset loading when fetch fails", async () => {
        const { onError, calendar } = setup(new Error("Network Error"));

        await calendar.loadRange(new Date(2026, 9, 1), new Date(2026, 11, 1));

        expect(onError).toHaveBeenCalledTimes(1);
        expect(calendar.isLoading.value).toBe(false);
        expect(calendar.events.value).toEqual([]);
    });

    it("should find appointment by id and return null for unknown id", () => {
        const { calendar } = setup([]);
        calendar.appointments.value = [createMockAppointment({ id: "appt-1" })];

        expect(calendar.findById("appt-1")?.id).toBe("appt-1");
        expect(calendar.findById("missing")).toBeNull();
    });

    it("should rebuild events with current veterinarians without refetching", async () => {
        const serviceMock = createAppointmentServiceMock();
        serviceMock.listByRange.mockResolvedValue([createMockAppointment()]);
        const veterinarians = ref<{ id: string; name: string }[]>([]);
        const calendar = createAppointmentsCalendar(serviceMock, vi.fn(), () => veterinarians.value);

        await calendar.loadRange(new Date(2026, 9, 1), new Date(2026, 10, 1));
        expect(calendar.events.value[0]!.title).toBe("Agendado");

        veterinarians.value = [{ id: "vet-1", name: "Dr. João" }];
        calendar.rebuildEvents();

        expect(calendar.events.value[0]!.title).toBe("- Dr. João");
        expect(serviceMock.listByRange).toHaveBeenCalledTimes(1);
    });
});
