import { describe, it, expect } from "vitest";
import { errorHandler } from "../../../infrastructure/http/errorHandler";
import type { AxiosError } from "axios";

describe("errorHandler", () => {
    it("should format AxiosError with response correctly", () => {
        const mockError = {
            message: "Request failed",
            response: {
                status: 404,
                data: { errorCode: "NOT_FOUND", errorMessage: "Resource not found" },
            },
        } as AxiosError;

        const result = errorHandler(mockError);

        expect(result.message).toBe("Request failed");
        expect(result.status).toBe(404);
        expect(result.data?.errorCode).toBe("NOT_FOUND");
        expect(result.data?.errorMessage).toBe("Resource not found");
        expect(result.response).toBe(mockError.response);
    });

    it("should handle errors without response", () => {
        const mockError = {
            message: "Network Error",
        } as AxiosError;

        const result = errorHandler(mockError);

        expect(result.message).toBe("Network Error");
        expect(result.status).toBeUndefined();
        expect(result.data).toBeUndefined();
        expect(result.response).toBeUndefined();
    });

    it("should default message to Unknown Error if missing", () => {
        const mockError = {} as AxiosError;

        const result = errorHandler(mockError);

        expect(result.message).toBe("Unknown Error");
        expect(result.status).toBeUndefined();
        expect(result.data).toBeUndefined();
        expect(result.response).toBeUndefined();
    });
});
