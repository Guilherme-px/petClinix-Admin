import { describe, it, expect, beforeEach } from "vitest";
import { ServiceRepository } from "../../../infrastructure/repositories/ServiceRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createServicePayload,
    createPaginatedServices,
} from "../../../test/factories/catalogFactory";

describe("ServiceRepository", () => {
    let httpClientMock: HttpClientMock;
    let serviceRepository: ServiceRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        serviceRepository = new ServiceRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with pagination params and return paginated data", async () => {
        const mockPaginatedResponse = createPaginatedServices();
        httpClientMock.get.mockResolvedValue(mockPaginatedResponse);

        const result = await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/services?pageNumber=1&pageSize=10");
        expect(result).toEqual(mockPaginatedResponse);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]!.name).toBe("Banho e Tosa");
    });

    it("should build query with custom page and pageSize", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedServices());

        await serviceRepository.list({ pageNumber: 3, pageSize: 25, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/services?pageNumber=3&pageSize=25");
    });

    it("should append search param when search is provided", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedServices());

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "banho" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=banho",
        );
    });

    it("should not append search param when search is empty", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedServices());

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        const calledUrl = httpClientMock.get.mock.calls[0][0];
        expect(calledUrl).not.toContain("search");
    });

    it("should pass whitespace search through to backend sanitization", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedServices());

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "   " });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=+++",
        );
    });

    it("should encode special characters in search term", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedServices());

        await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "banho & tosa" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/services?pageNumber=1&pageSize=10&search=banho+%26+tosa",
        );
    });

    it("should request correct page beyond first", async () => {
        const pageTwoResponse = createPaginatedServices({
            pageNumber: 2,
            hasPreviousPage: true,
        });

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
        httpClientMock.get.mockResolvedValue(
            createPaginatedServices({
                items: [],
                totalCount: 0,
                totalPages: 0,
            }),
        );

        const result = await serviceRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(result.items).toEqual([]);
        expect(result.totalCount).toBe(0);
    });

    it("should call register endpoint with correct payload", async () => {
        httpClientMock.post.mockResolvedValue(undefined);

        const payload = createServicePayload();

        await serviceRepository.register(payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/services", payload);
    });

    it("should propagate errors from register endpoint", async () => {
        httpClientMock.post.mockRejectedValue(new Error("Name already exists"));

        await expect(
            serviceRepository.register(createServicePayload({ name: "Duplicado" })),
        ).rejects.toThrow("Name already exists");
    });

    it("should call update endpoint with service id and payload", async () => {
        httpClientMock.put.mockResolvedValue(undefined);

        const payload = createServicePayload({
            name: "Banho Editado",
            durationInMinutes: 45,
            price: 120,
            requiresVeterinarian: true,
        });

        await serviceRepository.update("service-1", payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/services/service-1", payload);
    });

    it("should propagate errors from update endpoint", async () => {
        httpClientMock.put.mockRejectedValue(new Error("Service not found"));

        await expect(serviceRepository.update("service-1", createServicePayload())).rejects.toThrow(
            "Service not found",
        );
    });
});
