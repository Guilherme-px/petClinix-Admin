import { vi } from "vitest";
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";
import type { Pet, PetPayload } from "@/domain/models/Pet";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/domain/models/Appointment";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export const createStaffServiceMock = () => ({
    list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<StaffMember>>>(),
    getById: vi.fn<(id: string) => Promise<StaffMember>>(),
    register: vi.fn<(payload: RegisterStaffPayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: UpdateStaffPayload) => Promise<void>>(),
    remove: vi.fn<(id: string) => Promise<void>>(),
});

export const createTutorServiceMock = () => ({
    list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<Tutor>>>(),
    getById: vi.fn<(id: string) => Promise<Tutor>>(),
    register: vi.fn<(payload: RegisterTutorPayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: UpdateTutorPayload) => Promise<void>>(),
    remove: vi.fn<(id: string) => Promise<void>>(),
});

export const createCatalogServiceMock = () => ({
    list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>(),
    getById: vi.fn<(id: string) => Promise<VeterinaryService>>(),
    register: vi.fn<(payload: ServicePayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: ServicePayload) => Promise<void>>(),
    remove: vi.fn<(id: string) => Promise<void>>(),
});

export const createPetServiceMock = () => ({
    list: vi.fn<
        (
            tutorId: string,
            params: { pageNumber: number; pageSize: number; search: string },
        ) => Promise<PaginatedResponse<Pet>>
    >(),
    getById: vi.fn<(tutorId: string, petId: string) => Promise<Pet>>(),
    register: vi.fn<(tutorId: string, payload: PetPayload) => Promise<void>>(),
    update: vi.fn<(tutorId: string, petId: string, payload: PetPayload) => Promise<void>>(),
    remove: vi.fn<(tutorId: string, petId: string) => Promise<void>>(),
});

export const createAppointmentServiceMock = () => ({
    listByRange: vi.fn<(startDate: string, endDate: string) => Promise<Appointment[]>>(),
    getById: vi.fn<(id: string) => Promise<Appointment>>(),
    register: vi.fn<(payload: RegisterAppointmentPayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: UpdateAppointmentPayload) => Promise<void>>(),
    updateStatus: vi.fn<(id: string, status: string) => Promise<void>>(),
    getAvailableSlots:
        vi.fn<(vetId: string, serviceId: string, date: string) => Promise<string[]>>(),
});
