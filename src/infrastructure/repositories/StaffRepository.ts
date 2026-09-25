import type { IStaffRepository } from "@/domain/repositories/IStaffRepository";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/clinics/me/staff";

export class StaffRepository implements IStaffRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: RegisterStaffPayload): Promise<void> {
        await this.httpClient.post<void>(BASE_URL, payload);
    }

    async getById(staffId: string): Promise<StaffMember> {
        return this.httpClient.get<StaffMember>(`${BASE_URL}/${staffId}`);
    }

    async list(params: FetchParams): Promise<PaginatedResponse<StaffMember>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<StaffMember>>(`${BASE_URL}?${query}`);
    }

    async update(staffId: string, payload: UpdateStaffPayload): Promise<void> {
        await this.httpClient.put<void>(`${BASE_URL}/${staffId}`, payload);
    }

    async remove(staffId: string): Promise<void> {
        await this.httpClient.delete<void>(`${BASE_URL}/${staffId}`);
    }
}
