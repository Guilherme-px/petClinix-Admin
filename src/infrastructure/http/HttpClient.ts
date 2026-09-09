import axios, { type AxiosInstance, type InternalAxiosRequestConfig, AxiosError } from "axios";
import { errorHandler } from "./errorHandler";

export class HttpClient {
    private instance: AxiosInstance;
    private isRefreshing = false;
    private refreshFn?: () => Promise<string | null>;
    private logoutFn?: () => void;

    constructor(baseURL: string) {
        this.instance = axios.create({ baseURL });

        this.instance.interceptors.request.use((config) => {
            const token = localStorage.getItem("token");
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });

        this.instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & {
                    _retry?: boolean;
                };

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    if (this.isRefreshing) {
                        return Promise.reject(errorHandler(error));
                    }

                    this.isRefreshing = true;

                    try {
                        if (this.refreshFn) {
                            const newToken = await this.refreshFn();
                            if (newToken) {
                                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                                this.isRefreshing = false;
                                return this.instance(originalRequest);
                            }
                        }
                    } catch (refreshError) {
                        this.isRefreshing = false;
                        if (this.logoutFn) this.logoutFn();
                        return Promise.reject(errorHandler(refreshError));
                    }

                    this.isRefreshing = false;
                    if (this.logoutFn) this.logoutFn();
                }

                return Promise.reject(errorHandler(error));
            },
        );
    }

    setAuthHandlers(refreshFn: () => Promise<string | null>, logoutFn: () => void) {
        this.refreshFn = refreshFn;
        this.logoutFn = logoutFn;
    }

    async get<T>(url: string): Promise<T> {
        try {
            const response = await this.instance.get<T>(url);
            return response.data;
        } catch (error: unknown) {
            throw errorHandler(error);
        }
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
