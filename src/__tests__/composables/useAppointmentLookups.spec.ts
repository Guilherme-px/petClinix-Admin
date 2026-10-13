import { describe, it, expect, vi } from "vitest";
import { createAppointmentLookups } from "../../composables/useAppointmentLookups";
import {
    createStaffServiceMock,
    createTutorServiceMock,
    createCatalogServiceMock,
} from "../../test/mocks/services";
import { createMockStaff, createPaginatedStaff } from "../../test/factories/staffFactory";
import { createMockTutor, createPaginatedTutors } from "../../test/factories/tutorFactory";
import type { VeterinaryService } from "@/domain/models/VeterinaryService";
import type { PaginatedResponse } from "@/domain/models/pagination";
import type { FetchParams } from "@/domain/models/pagination";

const createCatalogPage = (): PaginatedResponse<VeterinaryService> => ({
    items: [
        {
            id: "service-1",
            name: "Consulta",
            description: null,
            durationInMinutes: 30,
            price: 100,
            requiresVeterinarian: true,
        },
        {
            id: "service-2",
            name: "Cirurgia",
            description: null,
            durationInMinutes: 90,
            price: 500,
            requiresVeterinarian: true,
        },
    ],
    totalCount: 2,
    pageNumber: 1,
    pageSize: 100,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
});

const setup = () => {
    const staffService = createStaffServiceMock();
    const tutorService = createTutorServiceMock();
    const catalogService = createCatalogServiceMock();

    staffService.list.mockResolvedValue(
        createPaginatedStaff({
            items: [
                createMockStaff({ id: "vet-1", name: "Dr. João", role: "Veterinarian" }),
                createMockStaff({ id: "rec-1", name: "Maria", role: "Receptionist" }),
            ],
            totalCount: 2,
        }),
    );
    tutorService.list.mockResolvedValue(
        createPaginatedTutors({
            items: [createMockTutor({ id: "tutor-1", name: "Guilherme" })],
            totalCount: 1,
        }),
    );
    catalogService.list.mockResolvedValue(createCatalogPage());

    const onError = vi.fn<(error: unknown) => void>();
    const lookups = createAppointmentLookups(
        { staffService, tutorService, catalogService },
        onError,
    );

    return { staffService, tutorService, catalogService, onError, lookups };
};

describe("createAppointmentLookups", () => {
    it("should start with empty lookups", () => {
        const { lookups } = setup();

        expect(lookups.veterinarians.value).toEqual([]);
        expect(lookups.tutors.value).toEqual([]);
        expect(lookups.services.value).toEqual([]);
    });

    it("should call all three services with default fetch params", async () => {
        const { staffService, tutorService, catalogService, lookups } = setup();

        await lookups.load();

        const expectedParams: FetchParams = { pageNumber: 1, pageSize: 100, search: "" };
        expect(staffService.list).toHaveBeenCalledWith(expectedParams);
        expect(tutorService.list).toHaveBeenCalledWith(expectedParams);
        expect(catalogService.list).toHaveBeenCalledWith(expectedParams);
    });

    it("should keep only veterinarians with id and name", async () => {
        const { lookups } = setup();

        await lookups.load();

        expect(lookups.veterinarians.value).toEqual([{ id: "vet-1", name: "Dr. João" }]);
    });

    it("should map tutors with phone from phoneNumber", async () => {
        const { lookups } = setup();

        await lookups.load();

        expect(lookups.tutors.value).toEqual([
            { id: "tutor-1", name: "Guilherme", phone: "11999998888" },
        ]);
    });

    it("should map services with price and duration", async () => {
        const { lookups } = setup();

        await lookups.load();

        expect(lookups.services.value).toEqual([
            { id: "service-1", name: "Consulta", price: 100, durationInMinutes: 30 },
            { id: "service-2", name: "Cirurgia", price: 500, durationInMinutes: 90 },
        ]);
    });

    it("should notify error and keep lookups empty when staff fetch fails", async () => {
        const { staffService, onError, lookups } = setup();
        staffService.list.mockRejectedValue(new Error("Network Error"));

        await lookups.load();

        expect(onError).toHaveBeenCalledTimes(1);
        expect(lookups.veterinarians.value).toEqual([]);
        expect(lookups.tutors.value).toEqual([]);
        expect(lookups.services.value).toEqual([]);
    });

    it("should notify error when catalog fetch fails even if others succeed", async () => {
        const { catalogService, onError, lookups } = setup();
        catalogService.list.mockRejectedValue(new Error("Catalog down"));

        await lookups.load();

        expect(onError).toHaveBeenCalledWith(new Error("Catalog down"));
        expect(lookups.veterinarians.value).toEqual([]);
    });
});
