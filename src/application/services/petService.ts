import type { IPetRepository } from "@/domain/repositories/IPetRepository";
import type { Pet, PetPayload } from "@/domain/models/Pet";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createPetService = (petRepository: IPetRepository) => {
    return {
        async register(tutorId: string, payload: PetPayload): Promise<void> {
            return await petRepository.register(tutorId, payload);
        },

        async list(tutorId: string, params: FetchParams): Promise<PaginatedResponse<Pet>> {
            return await petRepository.list(tutorId, params);
        },

        async getById(tutorId: string, petId: string): Promise<Pet> {
            return await petRepository.getById(tutorId, petId);
        },

        async update(tutorId: string, petId: string, payload: PetPayload): Promise<void> {
            return await petRepository.update(tutorId, petId, payload);
        },

        async remove(tutorId: string, petId: string): Promise<void> {
            return await petRepository.remove(tutorId, petId);
        },
    };
};

export type PetService = ReturnType<typeof createPetService>;
