export interface Tutor {
    id: string;
    name: string;
    cpf: string;
    email: string | null;
    phoneNumber: string;
    secondaryPhoneNumber: string | null;
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string | null;
    city: string;
    state: string;
    notes: string | null;
    isActive: boolean;
}

export interface RegisterTutorPayload {
    name: string;
    cpf: string;
    email: string | null;
    phoneNumber: string;
    secondaryPhoneNumber: string | null;
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string | null;
    city: string;
    state: string;
    notes: string | null;
}

export interface UpdateTutorPayload {
    name: string;
    email: string | null;
    phoneNumber: string;
    secondaryPhoneNumber: string | null;
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    complement: string | null;
    city: string;
    state: string;
    notes: string | null;
}
