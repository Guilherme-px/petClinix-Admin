export type AppointmentStatus = "Scheduled" | "Confirmed" | "InProgress" | "Completed" | "Canceled";

export interface Appointment {
    id: string;
    tutorId: string;
    petId: string;
    serviceId: string;
    veterinarianId: string;
    scheduledDateUtc: string;
    status: AppointmentStatus;
    notes: string | null;
}

export interface RegisterAppointmentPayload {
    tutorId: string;
    petId: string;
    serviceId: string;
    veterinarianId: string;
    scheduledDateUtc: string;
    notes: string | null;
}

export interface UpdateAppointmentPayload {
    veterinarianId: string;
    serviceId: string;
    scheduledDateUtc: string;
    notes: string | null;
}
