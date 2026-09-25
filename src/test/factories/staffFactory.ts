import type { PaginatedResponse } from "@/domain/models/pagination";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";

export function createMockStaff(overrides: Partial<StaffMember> = {}): StaffMember {
    return {
        id: "staff-1",
        name: "Dr. João Veterinário",
        email: "joao@petclinix.com",
        documentNumber: "12345678900",
        phoneNumber: "11999998888",
        birthDate: "1990-05-15",
        role: "Veterinário",
        ...overrides,
    };
}

export function createRegisterStaffPayload(
    overrides: Partial<RegisterStaffPayload> = {},
): RegisterStaffPayload {
    return {
        name: "Novo Profissional",
        email: "novo@petclinix.com",
        documentNumber: "98765432100",
        phoneNumber: "11988887777",
        birthDate: "1995-03-20",
        role: "Auxiliar",
        ...overrides,
    };
}

export function createUpdateStaffPayload(
    overrides: Partial<UpdateStaffPayload> = {},
): UpdateStaffPayload {
    return {
        name: "Profissional Atualizado",
        phoneNumber: "11977776666",
        birthDate: "1995-03-20",
        role: "Veterinário",
        ...overrides,
    };
}

export function createPaginatedStaff(
    overrides: Partial<PaginatedResponse<StaffMember>> = {},
): PaginatedResponse<StaffMember> {
    return {
        items: [createMockStaff()],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        ...overrides,
    };
}
