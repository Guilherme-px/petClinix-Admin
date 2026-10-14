import type { IServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/services";

export class ServiceRepository implements IServiceRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: ServicePayload): Promise<void> {
        await this.httpClient.post<void>(`${BASE_URL}`, payload);
    }

    async list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<VeterinaryService>>(`${BASE_URL}?${query}`);
    }

    async update(serviceId: string, payload: ServicePayload): Promise<void> {
        await this.httpClient.put<void>(`${BASE_URL}/${serviceId}`, payload);
    }

    async remove(serviceId: string): Promise<void> {
        await this.httpClient.delete<void>(`${BASE_URL}/${serviceId}`);
    }
}
