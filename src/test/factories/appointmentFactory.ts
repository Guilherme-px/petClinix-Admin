import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/domain/models/Appointment";
import type { AppointmentDto } from "@/infrastructure/dtos/AppointmentDto";

export const createMockAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
    id: "appt-1",
    tutorId: "tutor-1",
    petId: "pet-1",
    serviceId: "service-1",
    veterinarianId: "vet-1",
    scheduledDate: "2026-10-10",
    scheduledTime: "10:30",
    status: "Scheduled",
    notes: "Observação de teste",
    ...overrides,
});

export const createMockAppointments = (count = 2): Appointment[] =>
    Array.from({ length: count }, (_, i) =>
        createMockAppointment({
            id: `appt-${i + 1}`,
            scheduledTime: `${String(9 + i).padStart(2, "0")}:00`,
        }),
    );

export const createRegisterAppointmentPayload = (
    overrides: Partial<RegisterAppointmentPayload> = {},
): RegisterAppointmentPayload => ({
    tutorId: "tutor-1",
    petId: "pet-1",
    serviceId: "service-1",
    veterinarianId: "vet-1",
    date: "2026-10-10",
    time: "10:30",
    notes: null,
    ...overrides,
});

export const createUpdateAppointmentPayload = (
    overrides: Partial<UpdateAppointmentPayload> = {},
): UpdateAppointmentPayload => ({
    veterinarianId: "vet-1",
    serviceId: "service-1",
    date: "2026-10-10",
    time: "14:00",
    notes: null,
    ...overrides,
});

export const createMockAppointmentDto = (
    overrides: Partial<AppointmentDto> = {},
): AppointmentDto => ({
    id: "appt-1",
    tutorId: "tutor-1",
    petId: "pet-1",
    serviceId: "service-1",
    veterinarianId: "vet-1",
    scheduledDate: "2026-10-10",
    scheduledTime: "10:30:00",
    status: "Scheduled",
    notes: "Observação de teste",
    ...overrides,
});
