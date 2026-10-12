import { describe, it, expect, vi } from "vitest";
import { createPetOptionsController } from "../../composables/usePetOptions";
import type { PetService } from "../../application/services/petService";
import type { Pet, PetPayload } from "../../domain/models/Pet";
import type { PaginatedResponse } from "../../domain/models/pagination";
import { createMockPet } from "../../test/factories/petFactory";

const createServiceMock = () => ({
    list: vi.fn<
        (
            tutorId: string,
            params: { pageNumber: number; pageSize: number; search: string },
        ) => Promise<PaginatedResponse<Pet>>
    >(),
    getById: vi.fn<(tutorId: string, petId: string) => Promise<Pet>>(),
    register: vi.fn<(tutorId: string, payload: PetPayload) => Promise<void>>(),
    update: vi.fn<(tutorId: string, petId: string, payload: PetPayload) => Promise<void>>(),
    remove: vi.fn<(tutorId: string, petId: string) => Promise<void>>(),
});

const createPaginated = (pets: Pet[]): PaginatedResponse<Pet> => ({
    items: pets,
    totalCount: pets.length,
    pageNumber: 1,
    pageSize: 100,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
});

describe("createPetOptionsController", () => {
    it("should start with empty options and no loading", () => {
        const serviceMock = createServiceMock();
        const controller = createPetOptionsController(serviceMock as PetService);

        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
    });

    it("should clear options without calling the service when tutorId is empty", async () => {
        const serviceMock = createServiceMock();
        const controller = createPetOptionsController(serviceMock as PetService);

        await controller.load("");

        expect(serviceMock.list).not.toHaveBeenCalled();
        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
    });

    it("should map pets to options with name as label and id as value", async () => {
        const serviceMock = createServiceMock();
        serviceMock.list.mockResolvedValue(
            createPaginated([
                createMockPet({ id: "pet-1", name: "Rex" }),
                createMockPet({ id: "pet-2", name: "Bolinha" }),
            ]),
        );
        const controller = createPetOptionsController(serviceMock as PetService);

        await controller.load("tutor-1");

        expect(serviceMock.list).toHaveBeenCalledWith("tutor-1", {
            pageNumber: 1,
            pageSize: 100,
            search: "",
        });
        expect(controller.options.value).toEqual([
            { label: "Rex", value: "pet-1" },
            { label: "Bolinha", value: "pet-2" },
        ]);
        expect(controller.loading.value).toBe(false);
    });

    it("should set loading while the fetch is pending", async () => {
        const serviceMock = createServiceMock();
        let resolveList!: (value: PaginatedResponse<Pet>) => void;
        serviceMock.list.mockReturnValue(
            new Promise<PaginatedResponse<Pet>>((resolve) => (resolveList = resolve)),
        );
        const controller = createPetOptionsController(serviceMock as PetService);

        const pending = controller.load("tutor-1");
        expect(controller.loading.value).toBe(true);

        resolveList(createPaginated([]));
        await pending;

        expect(controller.loading.value).toBe(false);
    });

    it("should set empty options when tutor has no pets", async () => {
        const serviceMock = createServiceMock();
        serviceMock.list.mockResolvedValue(createPaginated([]));
        const controller = createPetOptionsController(serviceMock as PetService);

        await controller.load("tutor-1");

        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
    });

    it("should clear options and reset loading when the service fails", async () => {
        const serviceMock = createServiceMock();
        serviceMock.list.mockRejectedValue(new Error("Network Error"));
        const controller = createPetOptionsController(serviceMock as PetService);
        controller.options.value = [{ label: "Anterior", value: "pet-0" }];

        await controller.load("tutor-1");

        expect(controller.options.value).toEqual([]);
        expect(controller.loading.value).toBe(false);
    });
});
