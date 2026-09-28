import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";

export interface ITutorRepository {
    register(payload: RegisterTutorPayload): Promise<void>;
    list(params: FetchParams): Promise<PaginatedResponse<Tutor>>;
    getById(tutorId: string): Promise<Tutor>;
    update(tutorId: string, payload: UpdateTutorPayload): Promise<void>;
    remove(tutorId: string): Promise<void>;
}