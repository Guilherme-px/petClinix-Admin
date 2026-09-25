export interface StaffMember {
    id: string;
    name: string;
    email: string;
    documentNumber: string;
    phoneNumber: string;
    birthDate: string;
    role: string;
}

export interface RegisterStaffPayload {
    name: string;
    email: string;
    documentNumber: string;
    phoneNumber: string;
    birthDate: string;
    role: string;
}

export interface UpdateStaffPayload {
    name: string;
    phoneNumber: string;
    birthDate: string;
    role: string;
}