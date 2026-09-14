import type { User, UpdateAccountPayload, AuthResult } from "@/domain/models/Auth";

export function createUpdateAccountPayload(
    overrides: Partial<UpdateAccountPayload> = {},
): UpdateAccountPayload {
    return {
        userName: "Updated Name",
        userPhoneNumber: "11999998888",
        userBirthDate: "1990-01-01",
        newPassword: "NewPassword@123",
        clinicTradeName: "Updated Clinic",
        clinicLegalName: "Updated LLC",
        clinicDocumentNumber: "12345678000199",
        clinicEmail: "clinic@test.com",
        clinicPhoneNumber: "11988887777",
        clinicZipCode: "01001000",
        clinicStreet: "Updated Street",
        clinicNumber: "123",
        clinicNeighborhood: "Center",
        clinicComplement: "Apt 1",
        clinicCity: "Sao Paulo",
        clinicState: "SP",
        ...overrides,
    };
}

export function createMockUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        name: "John Doe",
        email: "john@petclinix.com",
        role: "Admin",
        phoneNumber: "11999998888",
        birthDate: "1990-01-01",
        documentNumber: "123.456.789-00",
        ...overrides,
    } as User;
}

export function createAuthResult(overrides: Partial<AuthResult> = {}): AuthResult {
    return {
        token: "fake-token",
        refreshToken: "fake-refresh",
        email: "admin@petclinix.com",
        name: "Admin User",
        role: "Admin",
        ...overrides,
    };
}
