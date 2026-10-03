import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { Pet, PetPayload } from "@/domain/models/Pet";

export interface IPetRepository {
    register(tutorId: string, payload: PetPayload): Promise<void>;
    list(tutorId: string, params: FetchParams): Promise<PaginatedResponse<Pet>>;
    getById(tutorId: string, petId: string): Promise<Pet>;
    update(tutorId: string, petId: string, payload: PetPayload): Promise<void>;
    remove(tutorId: string, petId: string): Promise<void>;
}
