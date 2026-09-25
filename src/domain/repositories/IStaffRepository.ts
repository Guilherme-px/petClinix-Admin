import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";

export interface IStaffRepository {
    register(payload: RegisterStaffPayload): Promise<void>;
    getById(staffId: string): Promise<StaffMember>;
    list(params: FetchParams): Promise<PaginatedResponse<StaffMember>>;
    update(staffId: string, payload: UpdateStaffPayload): Promise<void>;
    remove(staffId: string): Promise<void>;
}
