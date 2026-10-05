import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentStatus,
} from "@/domain/models/Appointment";

export interface IAppointmentRepository {
    register(payload: RegisterAppointmentPayload): Promise<void>;
    list(date: string, params: FetchParams): Promise<PaginatedResponse<Appointment>>;
    getById(appointmentId: string): Promise<Appointment>;
    getAvailableSlots(veterinarianId: string, serviceId: string, date: string): Promise<string[]>;
    update(appointmentId: string, payload: UpdateAppointmentPayload): Promise<void>;
    updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void>;
}