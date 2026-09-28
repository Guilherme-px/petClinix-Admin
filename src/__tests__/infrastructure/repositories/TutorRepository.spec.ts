import { describe, it, expect, beforeEach } from "vitest";
import { TutorRepository } from "../../../infrastructure/repositories/TutorRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";
import {
    createRegisterTutorPayload,
    createUpdateTutorPayload,
    createPaginatedTutors,
    createMockTutor,
} from "../../../test/factories/tutorFactory";

describe("TutorRepository", () => {
    let httpClientMock: HttpClientMock;
    let tutorRepository: TutorRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        tutorRepository = new TutorRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call list endpoint with pagination params", async () => {
        const paginated = createPaginatedTutors();
        httpClientMock.get.mockResolvedValue(paginated);

        const result = await tutorRepository.list({ pageNumber: 1, pageSize: 10, search: "" });

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/tutors?pageNumber=1&pageSize=10");
        expect(result).toEqual(paginated);
    });

    it("should append search param when provided", async () => {
        httpClientMock.get.mockResolvedValue(createPaginatedTutors());

        await tutorRepository.list({ pageNumber: 1, pageSize: 10, search: "maria" });

        expect(httpClientMock.get).toHaveBeenCalledWith(
            "/api/tutors?pageNumber=1&pageSize=10&search=maria",
        );
    });

    it("should call getById endpoint with tutor id", async () => {
        const mockTutor = createMockTutor();
        httpClientMock.get.mockResolvedValue(mockTutor);

        const result = await tutorRepository.getById("tutor-1");

        expect(httpClientMock.get).toHaveBeenCalledWith("/api/tutors/tutor-1");
        expect(result).toEqual(mockTutor);
    });

    it("should call register endpoint with payload", async () => {
        httpClientMock.post.mockResolvedValue(undefined);
        const payload = createRegisterTutorPayload();

        await tutorRepository.register(payload);

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/tutors", payload);
    });

    it("should call update endpoint with tutor id and payload", async () => {
        httpClientMock.put.mockResolvedValue(undefined);
        const payload = createUpdateTutorPayload();

        await tutorRepository.update("tutor-1", payload);

        expect(httpClientMock.put).toHaveBeenCalledWith("/api/tutors/tutor-1", payload);
    });

    it("should call delete endpoint with tutor id", async () => {
        httpClientMock.delete.mockResolvedValue(undefined);

        await tutorRepository.remove("tutor-1");

        expect(httpClientMock.delete).toHaveBeenCalledWith("/api/tutors/tutor-1");
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.get.mockRejectedValue(new Error("Unauthorized"));

        await expect(
            tutorRepository.list({ pageNumber: 1, pageSize: 10, search: "" }),
        ).rejects.toThrow("Unauthorized");
    });
});
