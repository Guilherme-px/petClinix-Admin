import type { IStaffRepository } from "@/domain/repositories/IStaffRepository";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createStaffService = (staffRepository: IStaffRepository) => {
    return {
        async register(payload: RegisterStaffPayload): Promise<void> {
            return await staffRepository.register(payload);
        },

        async getById(staffId: string): Promise<StaffMember> {
            return await staffRepository.getById(staffId);
        },

        async list(params: FetchParams): Promise<PaginatedResponse<StaffMember>> {
            return await staffRepository.list(params);
        },

        async update(staffId: string, payload: UpdateStaffPayload): Promise<void> {
            return await staffRepository.update(staffId, payload);
        },

        async remove(staffId: string): Promise<void> {
            return await staffRepository.remove(staffId);
        },
    };
};

export type StaffService = ReturnType<typeof createStaffService>;
