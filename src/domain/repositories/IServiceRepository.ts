import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";

export interface IServiceRepository {
    register(payload: ServicePayload): Promise<void>;
    list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>>;
    update(serviceId: string, payload: ServicePayload): Promise<void>;
}
