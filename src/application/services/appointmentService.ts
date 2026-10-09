import type { IAppointmentRepository } from "@/domain/repositories/IAppointmentRepository";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentStatus,
} from "@/domain/models/Appointment";

export const createAppointmentService = (appointmentRepository: IAppointmentRepository) => {
    return {
        async register(payload: RegisterAppointmentPayload): Promise<void> {
            return await appointmentRepository.register(payload);
        },

        async listByRange(startDate: string, endDate: string): Promise<Appointment[]> {
            return await appointmentRepository.listByRange(startDate, endDate);
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
