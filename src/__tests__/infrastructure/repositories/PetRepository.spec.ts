import { describe, it, expect, beforeEach } from "vitest";
import { PetRepository } from "../../../infrastructure/repositories/PetRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createPetPayload,
    createPaginatedPets,
    createMockPet,
} from "../../../test/factories/petFactory";

describe("PetRepository", () => {
    let httpClientMock: HttpClientMock;
    let petRepository: PetRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        petRepository = new PetRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with tutor id and pagination params", async () => {
        const paginated = createPaginatedPets();
        httpClientMock.get.mockResolvedValue(paginated);

        const result = await petRepository.list("tutor-1", {
            pageNumber: 1,
            pageSize: 10,
            search: "",
        });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/tutors/tutor-1/pets?pageNumber=1&pageSize=10",
        );
        expect(result).toEqual(paginated);
    });

    it("should append search param when provided", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedPets());

        await petRepository.list("tutor-1", {
            pageNumber: 1,
            pageSize: 10,
            search: "rex",
        });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/tutors/tutor-1/pets?pageNumber=1&pageSize=10&search=rex",
        );
    });

    it("should call getById endpoint with tutor id and pet id", async () => {
        const mockPet = createMockPet();
        httpClientMock.get.mockResolvedValue(mockPet);

        const result = await petRepository.getById("tutor-1", "pet-1");

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/tutors/tutor-1/pets/pet-1");
        expect(result).toEqual(mockPet);
    });

    it("should call register endpoint with tutor id and payload", async () => {
        httpClientMock.post.mockResolvedValue(undefined);
        const payload = createPetPayload();

        await petRepository.register("tutor-1", payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/tutors/tutor-1/pets", payload);
    });

    it("should call update endpoint with tutor id, pet id and payload", async () => {
        httpClientMock.put.mockResolvedValue(undefined);
        const payload = createPetPayload({ name: "Rex Atualizado" });

        await petRepository.update("tutor-1", "pet-1", payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/tutors/tutor-1/pets/pet-1", payload);
    });

    it("should call delete endpoint with tutor id and pet id", async () => {
        httpClientMock.delete.mockResolvedValue(undefined);

        await petRepository.remove("tutor-1", "pet-1");

        expect(httpClientMock.delete).toHaveBeenCalledWith("/api/tutors/tutor-1/pets/pet-1");
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.get.mockRejectedValue(new Error("Unauthorized"));

        await expect(
            petRepository.list("tutor-1", { pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Unauthorized");
    });
});
