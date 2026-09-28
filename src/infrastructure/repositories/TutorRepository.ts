import type { ITutorRepository } from "@/domain/repositories/ITutorRepository";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/tutors";

export class TutorRepository implements ITutorRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async register(payload: RegisterTutorPayload): Promise<void> {
        await this.httpClient.post<void>(BASE_URL, payload);
    }

    async list(params: FetchParams): Promise<PaginatedResponse<Tutor>> {
        const query = new URLSearchParams({
            pageNumber: String(params.pageNumber),
            pageSize: String(params.pageSize),
        });

        if (params.search) {
            query.set("search", params.search);
        }

        return this.httpClient.get<PaginatedResponse<Tutor>>(`${BASE_URL}?${query}`);
    }

    async getById(tutorId: string): Promise<Tutor> {
        return this.httpClient.get<Tutor>(`${BASE_URL}/${tutorId}`);
    }

    async update(tutorId: string, payload: UpdateTutorPayload): Promise<void> {
        await this.httpClient.put<void>(`${BASE_URL}/${tutorId}`, payload);
    }

    async remove(tutorId: string): Promise<void> {
        await this.httpClient.delete<void>(`${BASE_URL}/${tutorId}`);
    }
}
