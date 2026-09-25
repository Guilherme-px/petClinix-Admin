import { describe, it, expect, vi } from "vitest";
import { createStaffService } from "../../../application/services/staffService";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import type {
    StaffMember,
    RegisterStaffPayload,
    UpdateStaffPayload,
} from "../../../domain/models/Staff";
import {
    createMockStaff,
    createRegisterStaffPayload,
    createUpdateStaffPayload,
    createPaginatedStaff,
} from "../../../test/factories/staffFactory";

describe("staffService", () => {
    const createRepoMock = () => {
        const repo = {
            list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<StaffMember>>>(),
            getById: vi.fn<(id: string) => Promise<StaffMember>>(),
            register: vi.fn<(payload: RegisterStaffPayload) => Promise<void>>(),
            update: vi.fn<(id: string, payload: UpdateStaffPayload) => Promise<void>>(),
            remove: vi.fn<(id: string) => Promise<void>>(),
        };
        return {
            repo,
            listMock: repo.list,
            getByIdMock: repo.getById,
            registerMock: repo.register,
            updateMock: repo.update,
            removeMock: repo.remove,
        };
    };

    it("should call repository list with params", async () => {
        const { repo, listMock } = createRepoMock();
        const paginated = createPaginatedStaff();
        listMock.mockResolvedValue(paginated);

        const params: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };
        const result = await createStaffService(repo).list(params);

        expect(listMock).toHaveBeenCalledWith(params);
        expect(result).toEqual(paginated);
    });

    it("should call repository getById with staff id", async () => {
        const { repo, getByIdMock } = createRepoMock();
        const staff = createMockStaff();
        getByIdMock.mockResolvedValue(staff);

        const result = await createStaffService(repo).getById("staff-1");

        expect(getByIdMock).toHaveBeenCalledWith("staff-1");
        expect(result).toEqual(staff);
    });

    it("should call repository register with payload", async () => {
        const { repo, registerMock } = createRepoMock();
        const payload = createRegisterStaffPayload();

        await createStaffService(repo).register(payload);

        expect(registerMock).toHaveBeenCalledWith(payload);
    });

    it("should call repository update with staff id and payload", async () => {
        const { repo, updateMock } = createRepoMock();
        const payload = createUpdateStaffPayload();

        await createStaffService(repo).update("staff-1", payload);

        expect(updateMock).toHaveBeenCalledWith("staff-1", payload);
    });

    it("should call repository remove with staff id", async () => {
        const { repo, removeMock } = createRepoMock();

        await createStaffService(repo).remove("staff-1");

        expect(removeMock).toHaveBeenCalledWith("staff-1");
    });

    it("should propagate errors from repository", async () => {
        const { repo, listMock } = createRepoMock();
        listMock.mockRejectedValue(new Error("Network Error"));

        await expect(
            createStaffService(repo).list({ pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Network Error");
    });
});
