import { describe, it, expect, beforeEach } from "vitest";
import { AppointmentRepository } from "../../../infrastructure/repositories/AppointmentRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createMockAppointment,
    createMockAppointmentDto,
    createRegisterAppointmentPayload,
    createUpdateAppointmentPayload,
} from "../../../test/factories/appointmentFactory";

describe("AppointmentRepository", () => {
    let httpClientMock: HttpClientMock;
    let appointmentRepository: AppointmentRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        appointmentRepository = new AppointmentRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with start and end date params", async () => {
        const appointments = [createMockAppointment()];
        httpClientMock.get.mockResolvedValue([createMockAppointmentDto()]);

        const result = await appointmentRepository.listByRange("2026-10-01", "2026-10-31");

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/appointments?startDate=2026-10-01&endDate=2026-10-31",
        );
        expect(result).toEqual(appointments);
    });

    it("should normalize scheduled time when listing appointments", async () => {
        httpClientMock.get.mockResolvedValue([createMockAppointmentDto()]);

        const result = await appointmentRepository.listByRange("2026-10-01", "2026-10-31");

        expect(result[0]!.scheduledTime).toBe("10:30");
    });

    it("should call getById endpoint and normalize scheduled time", async () => {
        httpClientMock.get.mockResolvedValue(createMockAppointmentDto());

        const result = await appointmentRepository.getById("appt-1");

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/appointments/appt-1");
        expect(result).toEqual(createMockAppointment());
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

        await expect(appointmentRepository.listByRange("2026-10-01", "2026-10-31")).rejects.toThrow(
            "Unauthorized",
        );
    });
});
