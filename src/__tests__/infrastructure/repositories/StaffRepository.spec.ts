import { describe, it, expect, beforeEach } from "vitest";
import { StaffRepository } from "../../../infrastructure/repositories/StaffRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createRegisterStaffPayload,
    createUpdateStaffPayload,
    createPaginatedStaff,
    createMockStaff,
} from "../../../test/factories/staffFactory";

describe("StaffRepository", () => {
    let httpClientMock: HttpClientMock;
    let staffRepository: StaffRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        staffRepository = new StaffRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with pagination params", async () => {
        const paginated = createPaginatedStaff();
        httpClientMock.get.mockResolvedValue(paginated);

        const result = await staffRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/clinics/me/staff?pageNumber=1&pageSize=10");
        expect(result).toEqual(paginated);
    });

    it("should append search param when provided", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedStaff());

        await staffRepository.list({ pageNumber: 1, pageSize: 10, search: "joao" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/clinics/me/staff?pageNumber=1&pageSize=10&search=joao",
        );
    });

    it("should call getById endpoint with staff id", async () => {
        const mockStaff = createMockStaff();
        httpClientMock.get.mockResolvedValue(mockStaff);

        const result = await staffRepository.getById("staff-1");

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/clinics/me/staff/staff-1");
        expect(result).toEqual(mockStaff);
    });

    it("should call register endpoint with payload", async () => {
        httpClientMock.post.mockResolvedValue(undefined);
        const payload = createRegisterStaffPayload();

        await staffRepository.register(payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/clinics/me/staff", payload);
    });

    it("should call update endpoint with staff id and payload", async () => {
        httpClientMock.put.mockResolvedValue(undefined);
        const payload = createUpdateStaffPayload();

        await staffRepository.update("staff-1", payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/clinics/me/staff/staff-1", payload);
    });

    it("should call delete endpoint with staff id", async () => {
        httpClientMock.delete.mockResolvedValue(undefined);

        await staffRepository.remove("staff-1");

        expect(httpClientMock.delete).toHaveBeenCalledWith("/api/clinics/me/staff/staff-1");
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.get.mockRejectedValue(new Error("Unauthorized"));

        await expect(staffRepository.list({ pageNumber: 1, pageSize: 10, search: "" }))
            .rejects.toThrow("Unauthorized");
    });
});
