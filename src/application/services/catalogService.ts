import type { IServiceRepository } from "@/domain/repositories/IServiceRepository";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createCatalogService = (serviceRepository: IServiceRepository) => {
    return {
        async register(payload: ServicePayload): Promise<void> {
            return await serviceRepository.register(payload);
        },

        async list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>> {
            return await serviceRepository.list(params);
        },

        async update(serviceId: string, payload: ServicePayload): Promise<void> {
            return await serviceRepository.update(serviceId, payload);
        },
    };
};

export type CatalogService = ReturnType<typeof createCatalogService>;
