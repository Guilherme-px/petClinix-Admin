import type { IAppointmentRepository } from "@/domain/repositories/IAppointmentRepository";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
    AppointmentStatus,
} from "@/domain/models/Appointment";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/appointments";

export class AppointmentRepository implements IAppointmentRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: RegisterAppointmentPayload): Promise<void> {
        await this.httpClient.post<void>(BASE_URL, payload);
    }

    async list(date: string, params: FetchParams): Promise<PaginatedResponse<Appointment>> {
        const query = new URLSearchParams({
            date,
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<Appointment>>(`${BASE_URL}?${query}`);
    }

    async getById(appointmentId: string): Promise<Appointment> {
        return this.httpClient.get<Appointment>(`${BASE_URL}/${appointmentId}`);
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
