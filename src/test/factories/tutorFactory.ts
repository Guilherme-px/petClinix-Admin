import type { PaginatedResponse } from "@/domain/models/pagination";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";

export function createMockTutor(overrides: Partial<Tutor> = {}): Tutor {
    return {
        id: "tutor-1",
        name: "Maria Souza",
        cpf: "12345678900",
        email: "maria@teste.com",
        phoneNumber: "11999998888",
        secondaryPhoneNumber: null,
        zipCode: "01001000",
        street: "Main Street",
        number: "123",
        neighborhood: "Center",
        complement: null,
        city: "Sao Paulo",
        state: "SP",
        notes: null,
        isActive: true,
        ...overrides,
    };
}

export function createRegisterTutorPayload(
    overrides: Partial<RegisterTutorPayload> = {},
): RegisterTutorPayload {
    return {
        name: "Novo Tutor",
        cpf: "98765432100",
        email: null,
        phoneNumber: "11988887777",
        secondaryPhoneNumber: null,
        zipCode: "01001000",
        street: "Rua Nova",
        number: "456",
        neighborhood: "Center",
        complement: null,
        city: "Sao Paulo",
        state: "SP",
        notes: null,
        ...overrides,
    };
}

export function createUpdateTutorPayload(
    overrides: Partial<UpdateTutorPayload> = {},
): UpdateTutorPayload {
    return {
        name: "Tutor Atualizado",
        email: null,
        phoneNumber: "11977776666",
        secondaryPhoneNumber: null,
        zipCode: "01001000",
        street: "Rua Atualizada",
        number: "789",
        neighborhood: "Center",
        complement: null,
        city: "Sao Paulo",
        state: "SP",
        notes: "Atualizado",
        ...overrides,
    };
}

export function createPaginatedTutors(
    overrides: Partial<PaginatedResponse<Tutor>> = {},
): PaginatedResponse<Tutor> {
    return {
        items: [createMockTutor()],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
        ...overrides,
    };
}
