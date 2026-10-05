import type { IAppointmentRepository } from "@/domain/repositories/IAppointmentRepository";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentStatus,
} from "@/domain/models/Appointment";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createAppointmentService = (appointmentRepository: IAppointmentRepository) => {
    return {
        async register(payload: RegisterAppointmentPayload): Promise<void> {
            return await appointmentRepository.register(payload);
        },

        async list(date: string, params: FetchParams): Promise<PaginatedResponse<Appointment>> {
            return await appointmentRepository.list(date, params);
        },

        async getById(appointmentId: string): Promise<Appointment> {
            return await appointmentRepository.getById(appointmentId);
        },

        async getAvailableSlots(
            veterinarianId: string,
            serviceId: string,
            date: string,
        ): Promise<string[]> {
            return await appointmentRepository.getAvailableSlots(veterinarianId, serviceId, date);
        },

        async update(appointmentId: string, payload: UpdateAppointmentPayload): Promise<void> {
            return await appointmentRepository.update(appointmentId, payload);
        },

        async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
            return await appointmentRepository.updateStatus(appointmentId, status);
        },
    };
};

export type AppointmentService = ReturnType<typeof createAppointmentService>;
