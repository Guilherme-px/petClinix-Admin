import type { PaginatedResponse } from "@/domain/models/pagination";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";

export function createServicePayload(overrides: Partial<ServicePayload> = {}): ServicePayload {
    return {
        name: "Banho e Tosa",
        description: "Higiene completa",
        durationInMinutes: 60,
        price: 90,
        requiresVeterinarian: false,
        ...overrides,
    };
}

export function createMockService(overrides: Partial<VeterinaryService> = {}): VeterinaryService {
    return {
        id: "service-1",
        name: "Banho e Tosa",
        description: "Higiene completa",
        durationInMinutes: 60,
        price: 90,
        requiresVeterinarian: false,
        ...overrides,
    };
}

export function createPaginatedServices(
    overrides: Partial<PaginatedResponse<VeterinaryService>> = {},
): PaginatedResponse<VeterinaryService> {
    return {
        items: [createMockService()],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        ...overrides,
    };
}
