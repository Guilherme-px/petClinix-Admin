import type { IPetRepository } from "@/domain/repositories/IPetRepository";
import type { Pet, PetPayload } from "@/domain/models/Pet";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export class PetRepository implements IPetRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(tutorId: string, payload: PetPayload): Promise<void> {
        await this.httpClient.post<void>(`/api/tutors/${tutorId}/pets`, payload);
    }

    async list(tutorId: string, params: FetchParams): Promise<PaginatedResponse<Pet>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<Pet>>(`/api/tutors/${tutorId}/pets?${query}`);
    }

    async getById(tutorId: string, petId: string): Promise<Pet> {
        return this.httpClient.get<Pet>(`/api/tutors/${tutorId}/pets/${petId}`);
    }

    async update(tutorId: string, petId: string, payload: PetPayload): Promise<void> {
        await this.httpClient.put<void>(`/api/tutors/${tutorId}/pets/${petId}`, payload);
    }

    async remove(tutorId: string, petId: string): Promise<void> {
        await this.httpClient.delete<void>(`/api/tutors/${tutorId}/pets/${petId}`);
    }
}
