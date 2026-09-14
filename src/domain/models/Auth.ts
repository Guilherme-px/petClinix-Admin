export interface Clinic {
    clinicId: string;
    tradeName: string;
    legalName: string;
    documentNumber: string;
    email: string;
    phoneNumber: string;
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    city: string;
    state: string;
}

export interface User {
    id?: string;
    name?: string;
    email: string;
    role: string;
    documentNumber?: string;
    phoneNumber?: string;
    birthDate?: string;
    clinic?: Clinic;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthResult {
    token: string;
    refreshToken: string;
    email: string;
    role: string;
    name: string;
}

export interface UpdateAccountPayload {
    userName: string;
    userPhoneNumber: string;
    userBirthDate: string;
    newPassword?: string | null;
    clinicTradeName: string;
    clinicLegalName: string;
    clinicDocumentNumber: string;
    clinicEmail: string;
    clinicPhoneNumber: string;
    clinicZipCode: string;
    clinicStreet: string;
    clinicNumber: string;
    clinicNeighborhood: string;
    clinicComplement?: string;
    clinicCity: string;
    clinicState: string;
}
