import { describe, it, expect, vi } from "vitest";
import { createAppointmentService } from "../../../application/services/appointmentService";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "../../../domain/models/Appointment";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import {
    createMockAppointment,
    createRegisterAppointmentPayload,
    createUpdateAppointmentPayload,
    createPaginatedAppointments,
} from "../../../test/factories/appointmentFactory";

describe("appointmentService", () => {
    const createRepoMock = () => {
        const repo = {
            list: vi.fn<
                (date: string, params: FetchParams) => Promise<PaginatedResponse<Appointment>>
            >(),
            getById: vi.fn<(id: string) => Promise<Appointment>>(),
            register: vi.fn<(payload: RegisterAppointmentPayload) => Promise<void>>(),
            update: vi.fn<(id: string, payload: UpdateAppointmentPayload) => Promise<void>>(),
            updateStatus: vi.fn<(id: string, status: string) => Promise<void>>(),
            getAvailableSlots:
                vi.fn<(vetId: string, serviceId: string, date: string) => Promise<string[]>>(),
        };
        return {
            repo,
            listMock: repo.list,
            getByIdMock: repo.getById,
            registerMock: repo.register,
            updateMock: repo.update,
            updateStatusMock: repo.updateStatus,
            slotsMock: repo.getAvailableSlots,
        };
    };

    it("should call repository list with date and params", async () => {
        const { repo, listMock } = createRepoMock();
        const paginated = createPaginatedAppointments();
        listMock.mockResolvedValue(paginated);

        const params: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };
        const result = await createAppointmentService(repo).list("2026-10-10", params);

        expect(listMock).toHaveBeenCalledWith("2026-10-10", params);
        expect(result).toEqual(paginated);
    });

    it("should call repository getById with appointment id", async () => {
        const { repo, getByIdMock } = createRepoMock();
        const appointment = createMockAppointment();
        getByIdMock.mockResolvedValue(appointment);

        const result = await createAppointmentService(repo).getById("appt-1");

        expect(getByIdMock).toHaveBeenCalledWith("appt-1");
        expect(result).toEqual(appointment);
    });

    it("should call repository register with payload", async () => {
        const { repo, registerMock } = createRepoMock();
        const payload = createRegisterAppointmentPayload();

        await createAppointmentService(repo).register(payload);

        expect(registerMock).toHaveBeenCalledWith(payload);
    });

    it("should call repository update with appointment id and payload", async () => {
        const { repo, updateMock } = createRepoMock();
        const payload = createUpdateAppointmentPayload();

        await createAppointmentService(repo).update("appt-1", payload);

        expect(updateMock).toHaveBeenCalledWith("appt-1", payload);
    });

    it("should call repository updateStatus with appointment id and status", async () => {
        const { repo, updateStatusMock } = createRepoMock();

        await createAppointmentService(repo).updateStatus("appt-1", "Canceled");

        expect(updateStatusMock).toHaveBeenCalledWith("appt-1", "Canceled");
    });

    it("should call repository available slots with vet, service and date", async () => {
        const { repo, slotsMock } = createRepoMock();
        slotsMock.mockResolvedValue(["08:00", "09:00"]);

        const result = await createAppointmentService(repo).getAvailableSlots(
            "vet-1",
            "service-1",
            "2026-10-10",
        );

        expect(slotsMock).toHaveBeenCalledWith("vet-1", "service-1", "2026-10-10");
        expect(result).toEqual(["08:00", "09:00"]);
    });

    it("should propagate errors from repository", async () => {
        const { repo, listMock } = createRepoMock();
        listMock.mockRejectedValue(new Error("Network Error"));

        await expect(
            createAppointmentService(repo).list("2026-10-10", {
                pageNumber: 1,
                pageSize: 10,
                search: "",
            }),
        ).rejects.toThrow("Network Error");
    });
});
