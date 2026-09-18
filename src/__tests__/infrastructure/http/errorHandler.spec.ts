import { describe, it, expect } from "vitest";
import { errorHandler, getErrorMessage } from "../../../infrastructure/http/errorHandler";
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

describe("getErrorMessage", () => {
    it("should return api errorMessage when present", () => {
        const error = errorHandler({
            message: "Request failed",
            response: {
                status: 400,
                data: { errorCode: "x", errorMessage: "Nome já existe" },
            },
        } as AxiosError);

        expect(getErrorMessage(error)).toBe("Nome já existe");
    });

    it("should fall back to generic message when errorMessage is missing", () => {
        const error = errorHandler({
            message: "Request failed",
            response: {
                status: 500,
                data: { message: "Erro genérico do servidor" },
            },
        } as AxiosError);

        expect(getErrorMessage(error)).toBe("Erro genérico do servidor");
    });

    it("should return fallback when error has no usable data", () => {
        const error = errorHandler({ message: "Network Error" } as AxiosError);

        expect(getErrorMessage(error)).toBe("Ocorreu um erro inesperado.");
    });

    it("should return custom fallback when provided", () => {
        const error = errorHandler({ message: "Network Error" } as AxiosError);

        expect(getErrorMessage(error, "Erro ao carregar serviços.")).toBe(
            "Erro ao carregar serviços.",
        );
    });

    it("should handle null or undefined input", () => {
        expect(getErrorMessage(undefined)).toBe("Ocorreu um erro inesperado.");
        expect(getErrorMessage(null)).toBe("Ocorreu um erro inesperado.");
    });
});
