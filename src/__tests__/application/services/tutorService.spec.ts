import { describe, it, expect, vi } from "vitest";
import { createTutorService } from "../../../application/services/tutorService";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "../../../domain/models/Tutor";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import {
    createMockTutor,
    createRegisterTutorPayload,
    createUpdateTutorPayload,
    createPaginatedTutors,
} from "../../../test/factories/tutorFactory";

describe("tutorService", () => {
    const createRepoMock = () => {
        const repo = {
            list: vi.fn<(params: FetchParams) => Promise<PaginatedResponse<Tutor>>>(),
            getById: vi.fn<(id: string) => Promise<Tutor>>(),
            register: vi.fn<(payload: RegisterTutorPayload) => Promise<void>>(),
            update: vi.fn<(id: string, payload: UpdateTutorPayload) => Promise<void>>(),
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
        const paginated = createPaginatedTutors();
        listMock.mockResolvedValue(paginated);

        const params: FetchParams = { pageNumber: 1, pageSize: 10, search: "" };
        const result = await createTutorService(repo).list(params);

        expect(listMock).toHaveBeenCalledWith(params);
        expect(result).toEqual(paginated);
    });

    it("should call repository getById with tutor id", async () => {
        const { repo, getByIdMock } = createRepoMock();
        const tutor = createMockTutor();
        getByIdMock.mockResolvedValue(tutor);

        const result = await createTutorService(repo).getById("tutor-1");

        expect(getByIdMock).toHaveBeenCalledWith("tutor-1");
        expect(result).toEqual(tutor);
    });

    it("should call repository register with payload", async () => {
        const { repo, registerMock } = createRepoMock();
        const payload = createRegisterTutorPayload();

        await createTutorService(repo).register(payload);

        expect(registerMock).toHaveBeenCalledWith(payload);
    });

    it("should call repository update with tutor id and payload", async () => {
        const { repo, updateMock } = createRepoMock();
        const payload = createUpdateTutorPayload();

        await createTutorService(repo).update("tutor-1", payload);

        expect(updateMock).toHaveBeenCalledWith("tutor-1", payload);
    });

    it("should call repository remove with tutor id", async () => {
        const { repo, removeMock } = createRepoMock();

        await createTutorService(repo).remove("tutor-1");

        expect(removeMock).toHaveBeenCalledWith("tutor-1");
    });

    it("should propagate errors from repository", async () => {
        const { repo, listMock } = createRepoMock();
        listMock.mockRejectedValue(new Error("Network Error"));

        await expect(
            createTutorService(repo).list({ pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Network Error");
    });
});
