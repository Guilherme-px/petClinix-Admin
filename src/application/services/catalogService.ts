import type { IServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { VeterinaryService } from "@/domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createCatalogService = (serviceRepository: IServiceRepository) => {
    return {
        async list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>> {
            return await serviceRepository.list(params);
        },
    };
};

export type CatalogService = ReturnType<typeof createCatalogService>;
