import { describe, it, expect, beforeEach } from "vitest";
import { AppointmentRepository } from "../../../infrastructure/repositories/AppointmentRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createRegisterAppointmentPayload,
    createUpdateAppointmentPayload,
    createPaginatedAppointments,
    createMockAppointment,
} from "../../../test/factories/appointmentFactory";

describe("AppointmentRepository", () => {
    let httpClientMock: HttpClientMock;
    let appointmentRepository: AppointmentRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        appointmentRepository = new AppointmentRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with date and pagination params", async () => {
        const paginated = createPaginatedAppointments();
        httpClientMock.get.mockResolvedValue(paginated);

        const result = await appointmentRepository.list("2026-10-10", {
            pageNumber: 1,
            pageSize: 10,
            search: "",
        });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/appointments?date=2026-10-10&pageNumber=1&pageSize=10",
        );
        expect(result).toEqual(paginated);
    });

    it("should call getById endpoint with appointment id", async () => {
        const mockAppointment = createMockAppointment();
        httpClientMock.get.mockResolvedValue(mockAppointment);

        const result = await appointmentRepository.getById("appt-1");

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/appointments/appt-1");
        expect(result).toEqual(mockAppointment);
    });

    it("should call register endpoint with payload", async () => {
        httpClientMock.post.mockResolvedValue(undefined);
        const payload = createRegisterAppointmentPayload();

        await appointmentRepository.register(payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/appointments", payload);
    });

    it("should call update endpoint with appointment id and payload", async () => {
        httpClientMock.put.mockResolvedValue(undefined);
        const payload = createUpdateAppointmentPayload();

        await appointmentRepository.update("appt-1", payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/appointments/appt-1", payload);
    });

    it("should call updateStatus endpoint with status", async () => {
        httpClientMock.patch.mockResolvedValue(undefined);

        await appointmentRepository.updateStatus("appt-1", "Canceled");

        expect(httpClientMock.patch).toHaveBeenCalledWith("/api/appointments/appt-1/status", {
            newStatus: "Canceled",
        });
    });

    it("should call available-slots endpoint with vet, service and date", async () => {
        const slots = ["08:00", "09:00", "10:00"];
        httpClientMock.get.mockResolvedValue(slots);

        const result = await appointmentRepository.getAvailableSlots(
            "vet-1",
            "service-1",
            "2026-10-10",
        );

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/appointments/available-slots?vetId=vet-1&serviceId=service-1&date=2026-10-10",
        );
        expect(result).toEqual(slots);
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.get.mockRejectedValue(new Error("Unauthorized"));

        await expect(
            appointmentRepository.list("2026-10-10", {
                pageNumber: 1,
                pageSize: 10,
                search: "",
            }),
        ).rejects.toThrow("Unauthorized");
    });

    it("should append search param when provided", async () => {
        const paginated = createPaginatedAppointments();
        httpClientMock.get.mockResolvedValue(paginated);

        const result = await appointmentRepository.list("2026-10-10", {
            pageNumber: 1,
            pageSize: 10,
            search: "rex",
        });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/appointments?date=2026-10-10&pageNumber=1&pageSize=10&search=rex",
        );
        expect(result).toEqual(paginated);
    });
});
