import { describe, it, expect, vi } from "vitest";
import { createPetService } from "../../../application/services/petService";
import type { Pet, PetPayload } from "../../../domain/models/Pet";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import {
    createMockPet,
    createPetPayload,
    createPaginatedPets,
} from "../../../test/factories/petFactory";

describe("petService", () => {
    const createRepoMock = () => {
        const repo = {
            list: vi.fn<
                (tutorId: string, params: FetchParams) => Promise<PaginatedResponse<Pet>>
            >(),
            getById: vi.fn<(tutorId: string, petId: string) => Promise<Pet>>(),
            register: vi.fn<(tutorId: string, payload: PetPayload) => Promise<void>>(),
            update: vi.fn<(tutorId: string, petId: string, payload: PetPayload) => Promise<void>>(),
            remove: vi.fn<(tutorId: string, petId: string) => Promise<void>>(),
        };
        return {
            repo,
            listMock: repo.list,
            getByIdMock: repo.getById,
            registerMock: repo.register,
            updateMock: repo.update,
            removeMock: repo.remove,
        };
    };

    it("should call repository list with tutor id and params", async () => {
        const { repo, listMock } = createRepoMock();
        const paginated = createPaginatedPets();
        listMock.mockResolvedValue(paginated);

        const params: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };
        const result = await createPetService(repo).list("tutor-1", params);

        expect(listMock).toHaveBeenCalledWith("tutor-1", params);
        expect(result).toEqual(paginated);
    });

    it("should call repository getById with tutor id and pet id", async () => {
        const { repo, getByIdMock } = createRepoMock();
        const pet = createMockPet();
        getByIdMock.mockResolvedValue(pet);

        const result = await createPetService(repo).getById("tutor-1", "pet-1");

        expect(getByIdMock).toHaveBeenCalledWith("tutor-1", "pet-1");
        expect(result).toEqual(pet);
    });

    it("should call repository register with tutor id and payload", async () => {
        const { repo, registerMock } = createRepoMock();
        const payload = createPetPayload();

        await createPetService(repo).register("tutor-1", payload);

        expect(registerMock).toHaveBeenCalledWith("tutor-1", payload);
    });

    it("should call repository update with tutor id, pet id and payload", async () => {
        const { repo, updateMock } = createRepoMock();
        const payload = createPetPayload();

        await createPetService(repo).update("tutor-1", "pet-1", payload);

        expect(updateMock).toHaveBeenCalledWith("tutor-1", "pet-1", payload);
    });

    it("should call repository remove with tutor id and pet id", async () => {
        const { repo, removeMock } = createRepoMock();

        await createPetService(repo).remove("tutor-1", "pet-1");

        expect(removeMock).toHaveBeenCalledWith("tutor-1", "pet-1");
    });

    it("should propagate errors from repository", async () => {
        const { repo, listMock } = createRepoMock();
        listMock.mockRejectedValue(new Error("Network Error"));

        await expect(
            createPetService(repo).list("tutor-1", { pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Network Error");
    });
});
