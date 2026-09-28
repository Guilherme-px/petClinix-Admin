import type { ITutorRepository } from "@/domain/repositories/ITutorRepository";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createTutorService = (tutorRepository: ITutorRepository) => {
    return {
        async list(params: FetchParams): Promise<PaginatedResponse<Tutor>> {
            return await tutorRepository.list(params);
        },

        async getById(tutorId: string): Promise<Tutor> {
            return await tutorRepository.getById(tutorId);
        },

        async register(payload: RegisterTutorPayload): Promise<void> {
            return await tutorRepository.register(payload);
        },

        async update(tutorId: string, payload: UpdateTutorPayload): Promise<void> {
            return await tutorRepository.update(tutorId, payload);
        },

        async remove(tutorId: string): Promise<void> {
            return await tutorRepository.remove(tutorId);
        },
    };
};

export type TutorService = ReturnType<typeof createTutorService>;
