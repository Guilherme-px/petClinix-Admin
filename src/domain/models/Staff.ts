export type StaffRole = "Veterinarian" | "Receptionist";

export interface StaffMember {
    id: string;
    name: string;
    email: string;
    documentNumber: string;
    phoneNumber: string;
    birthDate: string;
    role: StaffRole;
    isActive: boolean;
}

export interface RegisterStaffPayload {
    name: string;
    email: string;
    documentNumber: string;
    phoneNumber: string;
    birthDate: string;
    role: StaffRole;
}

export interface UpdateStaffPayload {
    name: string;
    phoneNumber: string;
    birthDate: string;
    role: StaffRole;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
    Veterinarian: "Veterinário",
    Receptionist: "Recepcionista",
};

export const STAFF_ROLE_OPTIONS: { label: string; value: StaffRole }[] = [
    { label: "Veterinário", value: "Veterinarian" },
    { label: "Recepcionista", value: "Receptionist" },
];
