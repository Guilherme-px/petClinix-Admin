import type { IAppointmentRepository } from "@/domain/repositories/IAppointmentRepository";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentStatus,
} from "@/domain/models/Appointment";
import { HttpClient } from "@/infrastructure/http/HttpClient";
import type { AppointmentDto } from "../dtos/AppointmentDto";

const BASE_URL = "/api/appointments";

const toAppointment = (dto: AppointmentDto): Appointment => ({
    ...dto,
    scheduledTime: dto.scheduledTime.slice(0, 5),
});

export class AppointmentRepository implements IAppointmentRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: RegisterAppointmentPayload): Promise<void> {
        await this.httpClient.post<void>(BASE_URL, payload);
    }

    async listByRange(startDate: string, endDate: string): Promise<Appointment[]> {
        const query = new URLSearchParams({ startDate, endDate });
        const dtos = await this.httpClient.get<AppointmentDto[]>(`${BASE_URL}?${query}`);
        return dtos.map(toAppointment);
    }

    async getById(appointmentId: string): Promise<Appointment> {
        const dto = await this.httpClient.get<AppointmentDto>(`${BASE_URL}/${appointmentId}`);
        return toAppointment(dto);
    }

    async getAvailableSlots(
        veterinarianId: string,
        serviceId: string,
        date: string,
    ): Promise<string[]> {
        const query = new URLSearchParams({
            vetId: veterinarianId,
            serviceId,
            date,
        });

        return this.httpClient.get<string[]>(`${BASE_URL}/available-slots?${query}`);
    }

    async update(appointmentId: string, payload: UpdateAppointmentPayload): Promise<void> {
        await this.httpClient.put<void>(`${BASE_URL}/${appointmentId}`, payload);
    }

    async updateStatus(appointmentId: string, status: AppointmentStatus): Promise<void> {
        await this.httpClient.patch<void>(`${BASE_URL}/${appointmentId}/status`, {
            newStatus: status,
        });
    }
}
