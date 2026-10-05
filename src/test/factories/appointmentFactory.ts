import type { PaginatedResponse } from "@/domain/models/pagination";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/domain/models/Appointment";

export function createMockAppointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: "appt-1",
        tutorId: "tutor-1",
        petId: "pet-1",
        serviceId: "service-1",
        veterinarianId: "vet-1",
        scheduledDateUtc: "2026-10-10T13:00:00Z",
        status: "Scheduled",
        notes: null,
        ...overrides,
    };
}

export function createRegisterAppointmentPayload(
    overrides: Partial<RegisterAppointmentPayload> = {},
): RegisterAppointmentPayload {
    return {
        tutorId: "tutor-1",
        petId: "pet-1",
        serviceId: "service-1",
        veterinarianId: "vet-1",
        scheduledDateUtc: "2026-10-10T13:00:00Z",
        notes: null,
        ...overrides,
    };
}

export function createUpdateAppointmentPayload(
    overrides: Partial<UpdateAppointmentPayload> = {},
): UpdateAppointmentPayload {
    return {
        veterinarianId: "vet-1",
        serviceId: "service-1",
        scheduledDateUtc: "2026-10-10T15:00:00Z",
        notes: "Reagendado",
        ...overrides,
    };
}

export function createPaginatedAppointments(
    overrides: Partial<PaginatedResponse<Appointment>> = {},
): PaginatedResponse<Appointment> {
    return {
        items: [createMockAppointment()],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        ...overrides,
    };
}
