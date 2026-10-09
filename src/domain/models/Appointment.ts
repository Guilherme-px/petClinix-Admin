export type AppointmentStatus = "Scheduled" | "Confirmed" | "Completed" | "Canceled" | "NoShow";

export interface Appointment {
    id: string;
    tutorId: string;
    petId: string;
    serviceId: string;
    veterinarianId: string;
    scheduledDate: string;
    scheduledTime: string;
    status: AppointmentStatus;
    notes: string | null;
}

export interface RegisterAppointmentPayload {
    tutorId: string;
    petId: string;
    serviceId: string;
    veterinarianId: string;
    date: string;
    time: string;
    notes: string | null;
}

export interface UpdateAppointmentPayload {
    veterinarianId: string;
    serviceId: string;
    date: string;
    time: string;
    notes: string | null;
}
