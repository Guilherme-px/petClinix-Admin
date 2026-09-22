import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { VeterinaryService } from "@/domain/models/VeterinaryService";

export interface IServiceRepository {
    list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>>;
}
