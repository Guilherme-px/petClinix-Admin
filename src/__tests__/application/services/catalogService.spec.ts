import { describe, it, expect, vi } from "vitest";
import { createCatalogService } from "../../../application/services/catalogService";
import type { IServiceRepository } from "../../../domain/repositories/IServiceRepository";
import type { VeterinaryService } from "../../../domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";

describe("catalogService", () => {
    const mockService: VeterinaryService = {
        id: "service-1",
        name: "Banho e Tosa",
        description: "Higiene completa",
        durationInMinutes: 60,
        price: 90,
        requiresVeterinarian: false,
    };

    const mockPaginated: PaginatedResponse<VeterinaryService> = {
        items: [mockService],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    };

    const mockParams: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };

    it("should call repository list and return paginated result", async () => {
        const listMock = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockResolvedValue(mockPaginated);
        const mockRepo = { list: listMock } as unknown as IServiceRepository;

        const service = createCatalogService(mockRepo);
        const result = await service.list(mockParams);

        expect(listMock).toHaveBeenCalledWith(mockParams);
        expect(result).toEqual(mockPaginated);
    });

    it("should pass search term through to repository", async () => {
        const listMock = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockResolvedValue({ ...mockPaginated, items: [], totalCount: 0 });
        const mockRepo = { list: listMock } as unknown as IServiceRepository;

        const params: FetchParams = { pageNumber: 2, pageSize: 25, search: "banho" };
        await createCatalogService(mockRepo).list(params);

        expect(listMock).toHaveBeenCalledWith(params);
    });

    it("should propagate errors from repository", async () => {
        const listMock = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockRejectedValue(new Error("Network Error"));
        const mockRepo = { list: listMock } as unknown as IServiceRepository;

        await expect(createCatalogService(mockRepo).list(mockParams)).rejects.toThrow(
            "Network Error",
        );
    });
});
