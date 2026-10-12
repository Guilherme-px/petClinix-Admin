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

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    Scheduled: "Agendado",
    Confirmed: "Confirmado",
    Completed: "Concluído",
    Canceled: "Cancelado",
    NoShow: "Falta",
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
    Scheduled: "#2196F3",
    Confirmed: "#009688",
    Completed: "#4CAF50",
    Canceled: "#F44336",
    NoShow: "#BF360C",
};

export interface VeterinarianLookup {
    id: string;
    name: string;
}

export interface TutorLookup {
    id: string;
    name: string;
    phone: string | null;
}

export interface ServiceLookup {
    id: string;
    name: string;
    price: number;
    durationInMinutes: number;
}

export const appointmentStatusLabel = (status: string): string =>
    APPOINTMENT_STATUS_LABELS[status as AppointmentStatus] ?? status;

export const appointmentStatusColor = (status: string): string =>
    APPOINTMENT_STATUS_COLORS[status as AppointmentStatus] ?? "#9E9E9E";
