import type { IStaffRepository } from "@/domain/repositories/IStaffRepository";
import type {
    StaffMember,
    RegisterStaffPayload,
    UpdateStaffPayload,
    VeterinarianOption,
} from "@/domain/models/Staff";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/clinics/me";
const STAFF_URL = `${BASE_URL}/staff`;

export class StaffRepository implements IStaffRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: RegisterStaffPayload): Promise<void> {
        await this.httpClient.post<void>(STAFF_URL, payload);
    }

    async getById(staffId: string): Promise<StaffMember> {
        return this.httpClient.get<StaffMember>(`${STAFF_URL}/${staffId}`);
    }

    async list(params: FetchParams): Promise<PaginatedResponse<StaffMember>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<StaffMember>>(`${STAFF_URL}?${query}`);
    }

    async getVeterinarians(): Promise<VeterinarianOption[]> {
        return this.httpClient.get<VeterinarianOption[]>(`${BASE_URL}/veterinarians`);
    }

    async update(staffId: string, payload: UpdateStaffPayload): Promise<void> {
        await this.httpClient.put<void>(`${STAFF_URL}/${staffId}`, payload);
    }

    async remove(staffId: string): Promise<void> {
        await this.httpClient.delete<void>(`${STAFF_URL}/${staffId}`);
    }
}
