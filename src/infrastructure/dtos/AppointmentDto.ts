import type { AppointmentStatus } from "@/domain/models/Appointment";

export interface AppointmentDto {
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
