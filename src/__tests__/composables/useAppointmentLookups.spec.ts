import { describe, it, expect, vi } from "vitest";
import { createAppointmentLookups } from "../../composables/useAppointmentLookups";
import {
    createStaffServiceMock,
    createTutorServiceMock,
    createCatalogServiceMock,
} from "../../test/mocks/services";
import { createMockTutor, createPaginatedTutors } from "../../test/factories/tutorFactory";
import type { VeterinaryService } from "../../domain/models/VeterinaryService";
import type { PaginatedResponse, FetchParams } from "../../domain/models/pagination";

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

    staffService.getVeterinarians.mockResolvedValue([
        { id: "vet-1", name: "Dr. João" },
        { id: "vet-2", name: "Dra. Maria" },
    ]);
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

    it("should call staff service via dedicated endpoint and others with fetch params", async () => {
        const { staffService, tutorService, catalogService, lookups } = setup();

        await lookups.load();

        expect(staffService.getVeterinarians).toHaveBeenCalled();
        expect(staffService.list).not.toHaveBeenCalled();

        const expectedParams: FetchParams = { pageNumber: 1, pageSize: 100, search: "" };
        expect(tutorService.list).toHaveBeenCalledWith(expectedParams);
        expect(catalogService.list).toHaveBeenCalledWith(expectedParams);
    });

    it("should load veterinarians from the dedicated endpoint", async () => {
        const { lookups } = setup();

        await lookups.load();

        expect(lookups.veterinarians.value).toEqual([
            { id: "vet-1", name: "Dr. João" },
            { id: "vet-2", name: "Dra. Maria" },
        ]);
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

    it("should notify error and keep lookups empty when veterinarians fetch fails", async () => {
        const { staffService, onError, lookups } = setup();
        staffService.getVeterinarians.mockRejectedValue(new Error("Network Error"));

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
