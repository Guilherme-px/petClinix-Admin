import type { IServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { VeterinaryService } from "@/domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class ServiceRepository implements IServiceRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
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
