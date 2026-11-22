import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload, VeterinarianOption } from "@/domain/models/Staff";
import type { StaffLimit } from "../models/StaffLimit";

export interface IStaffRepository {
    register(payload: RegisterStaffPayload): Promise<void>;
    getById(staffId: string): Promise<StaffMember>;
    list(params: FetchParams): Promise<PaginatedResponse<StaffMember>>;
    getVeterinarians(): Promise<VeterinarianOption[]>;
    getStaffLimit(): Promise<StaffLimit>;
    update(staffId: string, payload: UpdateStaffPayload): Promise<void>;
    remove(staffId: string): Promise<void>;
}
