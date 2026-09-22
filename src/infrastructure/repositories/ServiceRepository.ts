import type { IServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class ServiceRepository implements IServiceRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: ServicePayload): Promise<void> {
        await this.httpClient.post<void>("/api/services", payload);
    }

    async list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<VeterinaryService>>(`/api/services?${query}`);
    }
}
