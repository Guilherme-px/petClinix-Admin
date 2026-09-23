import { describe, it, expect, vi } from "vitest";
import { createCatalogService } from "../../../application/services/catalogService";
import type { ServicePayload, VeterinaryService } from "../../../domain/models/VeterinaryService";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import {
    createServicePayload,
    createPaginatedServices,
} from "../../../test/factories/catalogFactory";

describe("catalogService", () => {
    const createRepoMock = () => {
        const repo = {
            list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>(),
            register: vi.fn<(payload: ServicePayload) => Promise<void>>(),
            update: vi.fn<(id: string, payload: ServicePayload) => Promise<void>>(),
            remove: vi.fn<(id: string) => Promise<void>>(),
        };
        return {
            repo,
            listMock: repo.list,
            registerMock: repo.register,
            updateMock: repo.update,
            removeMock: repo.remove,
        };
    };

    it("should call repository list and return paginated result", async () => {
        const { repo, listMock } = createRepoMock();
        const paginated = createPaginatedServices();
        listMock.mockResolvedValue(paginated);

        const params: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };
        const result = await createCatalogService(repo).list(params);

        expect(listMock).toHaveBeenCalledWith(params);
        expect(result).toEqual(paginated);
    });

    it("should pass search term through to repository", async () => {
        const { repo, listMock } = createRepoMock();

        const params: FetchParams = { pageNumber: 2, pageSize: 25, search: "banho" };
        await createCatalogService(repo).list(params);

        expect(listMock).toHaveBeenCalledWith(params);
    });

    it("should propagate errors from repository", async () => {
        const { repo, listMock } = createRepoMock();
        listMock.mockRejectedValue(new Error("Network Error"));

        await expect(
            createCatalogService(repo).list({ pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Network Error");
    });

    it("should call repository register with payload", async () => {
        const { repo, registerMock } = createRepoMock();

        const payload = createServicePayload({
            name: "Consulta",
            description: null,
            durationInMinutes: 30,
            price: 150,
            requiresVeterinarian: true,
        });

        await createCatalogService(repo).register(payload);

        expect(registerMock).toHaveBeenCalledWith(payload);
    });

    it("should call repository update with service id and payload", async () => {
        const { repo, updateMock } = createRepoMock();

        const payload = createServicePayload();

        await createCatalogService(repo).update("service-1", payload);

        expect(updateMock).toHaveBeenCalledWith("service-1", payload);
    });

    it("should call repository remove with service id", async () => {
        const { repo, removeMock } = createRepoMock();

        await createCatalogService(repo).remove("service-1");

        expect(removeMock).toHaveBeenCalledWith("service-1");
    });
});
