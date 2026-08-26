import type { AxiosError, AxiosResponse } from "axios";

export interface FetchError extends Error {
    response?: AxiosResponse;
    data?: { errorCode?: string; errorMessage?: string; message?: string };
    status?: number;
}

export const errorHandler = (error: unknown): FetchError => {
    const axiosError = error as AxiosError;
    const fetchError: FetchError = new Error(axiosError.message || "Unknown Error") as FetchError;

    if (axiosError.response) {
        fetchError.response = axiosError.response;
        fetchError.data = axiosError.response.data as {
            errorCode?: string;
            errorMessage?: string;
            message?: string;
        };
        fetchError.status = axiosError.response.status;
    }

    return fetchError;
};
