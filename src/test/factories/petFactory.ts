import type { PaginatedResponse } from "@/domain/models/pagination";
import type { Pet, PetPayload } from "@/domain/models/Pet";

export function createMockPet(overrides: Partial<Pet> = {}): Pet {
    return {
        id: "pet-1",
        name: "Rex",
        species: "Dog",
        breed: "Vira Lata",
        birthDate: "2020-05-10",
        sex: "Male",
        weight: 15.5,
        isNeutered: true,
        notes: null,
        ...overrides,
    } as Pet;
}

export function createPetPayload(overrides: Partial<PetPayload> = {}): PetPayload {
    return {
        name: "Rex",
        species: "Dog",
        breed: "Vira Lata",
        birthDate: "2020-05-10",
        sex: "Male",
        weight: 15.5,
        isNeutered: true,
        notes: null,
        ...overrides,
    };
}

export function createPaginatedPets(
    overrides: Partial<PaginatedResponse<Pet>> = {},
): PaginatedResponse<Pet> {
    return {
        items: [createMockPet()],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        ...overrides,
    };
}
