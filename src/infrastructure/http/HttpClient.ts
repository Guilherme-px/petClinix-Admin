import axios, { type AxiosInstance } from "axios";
import { errorHandler } from "./errorHandler";

export class HttpClient {
    private instance: AxiosInstance;

    constructor(baseURL: string) {
        this.instance = axios.create({ baseURL });

        this.instance.interceptors.request.use((config) => {
            const token = localStorage.getItem("token");
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }

    async post<T, TRequest = unknown>(url: string, data: TRequest): Promise<T> {
        try {
            const response = await this.instance.post<T>(url, data);
            return response.data;
        } catch (error: unknown) {
            throw errorHandler(error);
        }
    }
}
