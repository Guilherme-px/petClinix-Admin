import type { FetchParams, PaginatedResponse } from "@/domain/models/common";
import type { VeterinaryService } from "@/domain/models/VeterinaryService";

export interface IServiceRepository {
    list(params: FetchParams): Promise<PaginatedResponse<VeterinaryService>>;
}
