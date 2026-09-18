import { describe, it, expect, beforeEach } from "vitest";
import { ServiceRepository } from "../../../infrastructure/repositories/ServiceRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import type { PaginatedResponse } from "../../../domain/models/common";
import type { VeterinaryService } from "../../../domain/models/VeterinaryService";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";

describe("ServiceRepository", () => {
    let httpClientMock: HttpClientMock;
    let serviceRepository: ServiceRepository;

    const mockPaginatedResponse: PaginatedResponse<VeterinaryService> = {
        items: [
            {
                id: "service-1",
                name: "Banho e Tosa",
                description: "Higiene completa",
                durationInMinutes: 60,
                price: 90,
                requiresVeterinarian: false,
            },
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    };

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        serviceRepository = new ServiceRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with pagination params and return paginated data", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        const result = await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/services?pageNumber=1&pageSize=10");
        expect(result).toEqual(mockPaginatedResponse);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]!.name).toBe("Banho e Tosa");
    });

    it("should build query with custom page and pageSize", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        await serviceRepository.list({ pageNumber: 3, pageSize: 25, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/services?pageNumber=3&pageSize=25");
    });

    it("should append search param when search is provided", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "banho" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=banho",
        );
    });

    it("should not append search param when search is empty", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        const calledUrl = httpClientMock.get.mock.calls[0][0];
        expect(calledUrl).not.toContain("search");
    });

    it("should pass whitespace search through to backend sanitization", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "   " });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=+++",
        );
    });

    it("should encode special characters in search term", async () => {
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "banho & tosa" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=banho+%26+tosa",
        );
    });

    it("should request correct page beyond first", async () => {
        const pageTwoResponse: PaginatedResponse<VeterinaryService> = {
            ...mockPaginatedResponse,
            pageNumber: 2,
            hasPreviousPage: true,
        };

        httpClientMock.get.mockResolvedValue(pageTwoResponse);

        const result = await serviceRepository.list({ pageNumber: 2, pageSize: 5, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/services?pageNumber=2&pageSize=5");
        expect(result.pageNumber).toBe(2);
        expect(result.hasPreviousPage).toBe(true);
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.get.mockRejectedValue(new Error("Unauthorized"));

        await expect(
            serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Unauthorized");
    });

    it("should handle empty result set from api", async () => {
        const emptyResponse: PaginatedResponse<VeterinaryService> = {
            items: [],
            totalCount: 0,
            pageNumber: 1,
            pageSize: 10,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
        };

        httpClientMock.get.mockResolvedValue(emptyResponse);

        const result = await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
    });
});
