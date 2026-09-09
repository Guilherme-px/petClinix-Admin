import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import axios from "axios";
import { HttpClient } from "../../../infrastructure/http/HttpClient";

type MockAxios = Mock & {
    interceptors: {
        request: { use: Mock };
        response: { use: Mock };
    };
    post: Mock;
    get: Mock;
};

vi.mock("axios", () => {
    const instance = vi.fn<() => Promise<unknown>>() as unknown as MockAxios;
    instance.interceptors = {
        request: { use: vi.fn<() => void>() },
        response: { use: vi.fn<() => void>() },
    };
    instance.post = vi.fn<() => Promise<unknown>>();
    instance.get = vi.fn<() => Promise<unknown>>();
    return {
        default: {
            create: vi.fn<() => MockAxios>(() => instance),
        },
    };
});

vi.mock("@/infrastructure/http/errorHandler", () => ({
    errorHandler: vi.fn<(err: unknown) => unknown>((err: unknown) => err),
}));

describe("HttpClient", () => {
    let client: HttpClient;
    let mockInstance: MockAxios;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        client = new HttpClient("http://test.com");
        mockInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0]
            .value as MockAxios;
    });

    const getRequestInterceptor = () => mockInstance.interceptors.request.use.mock.calls[0][0];
    const getResponseSuccessInterceptor = () =>
        mockInstance.interceptors.response.use.mock.calls[0][0];
    const getResponseErrorInterceptor = () =>
        mockInstance.interceptors.response.use.mock.calls[0][1];

    it("should be created with baseURL", () => {
        expect(axios.create).toHaveBeenCalledWith({ baseURL: "http://test.com" });
    });

    it("should add auth token to headers if present in localStorage", () => {
        localStorage.setItem("token", "fake-token");
        const config = { headers: {} };
        const result = getRequestInterceptor()(config);
        expect(result.headers.Authorization).toBe("Bearer fake-token");
    });

    it("should not add auth token if not present in localStorage", () => {
        const config = { headers: {} };
        const result = getRequestInterceptor()(config);
        expect(result.headers.Authorization).toBeUndefined();
    });

    it("should return response on success in response interceptor", async () => {
        const response = { data: "ok" };
        const result = await getResponseSuccessInterceptor()(response);
        expect(result).toEqual(response);
    });

    it("should make post request and return data", async () => {
        mockInstance.post.mockResolvedValue({ data: { success: true } });
        const result = await client.post("/api", { foo: "bar" });
        expect(mockInstance.post).toHaveBeenCalledWith("/api", { foo: "bar" });
        expect(result).toEqual({ success: true });
    });

    it("should throw error on post failure", async () => {
        const error = new Error("Network Error");
        mockInstance.post.mockRejectedValue(error);
        await expect(client.post("/api", {})).rejects.toThrow("Network Error");
    });

    it("should throw error on get failure", async () => {
        const error = new Error("Network Error");
        mockInstance.get.mockRejectedValue(error);
        await expect(client.get("/api")).rejects.toThrow("Network Error");
    });

    it("should handle 401 by refreshing token and retrying request", async () => {
        const refreshFn = vi.fn<() => Promise<string | null>>().mockResolvedValue("new-token");
        const logoutFn = vi.fn<() => void>();
        client.setAuthHandlers(refreshFn, logoutFn);

        const error401 = { response: { status: 401 }, config: { headers: {} } };
        mockInstance.mockResolvedValueOnce({ data: "retried" });

        const interceptor = getResponseErrorInterceptor();
        const result = await interceptor(error401);

        expect(refreshFn).toHaveBeenCalled();
        expect(logoutFn).not.toHaveBeenCalled();
        expect(result).toEqual({ data: "retried" });
    });

    it("should logout if refresh token fails", async () => {
        const refreshFn = vi
            .fn<() => Promise<string | null>>()
            .mockRejectedValue(new Error("Refresh failed"));
        const logoutFn = vi.fn<() => void>();
        client.setAuthHandlers(refreshFn, logoutFn);

        const error401 = { response: { status: 401 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();

        await expect(interceptor(error401)).rejects.toThrow("Refresh failed");
        expect(logoutFn).toHaveBeenCalled();
    });

    it("should logout if refresh token returns null", async () => {
        const refreshFn = vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
        const logoutFn = vi.fn<() => void>();
        client.setAuthHandlers(refreshFn, logoutFn);

        const error401 = { response: { status: 401 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();

        await expect(interceptor(error401)).rejects.toEqual(error401);
        expect(logoutFn).toHaveBeenCalled();
    });

    it("should reject immediately if 401 and already refreshing", async () => {
        const refreshFn = vi.fn<() => Promise<string | null>>();
        const logoutFn = vi.fn<() => void>();
        client.setAuthHandlers(refreshFn, logoutFn);

        (client as unknown as { isRefreshing: boolean }).isRefreshing = true;

        const error401 = { response: { status: 401 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();

        await expect(interceptor(error401)).rejects.toEqual(error401);
        expect(refreshFn).not.toHaveBeenCalled();
    });

    it("should reject non-401 errors", async () => {
        const error500 = { response: { status: 500 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();
        await expect(interceptor(error500)).rejects.toEqual(error500);
    });

    it("should reject if _retry is already true on 401", async () => {
        const error401 = { response: { status: 401 }, config: { headers: {}, _retry: true } };
        const interceptor = getResponseErrorInterceptor();
        await expect(interceptor(error401)).rejects.toEqual(error401);
    });

    it("should reject if refreshFn is not set on 401", async () => {
        const error401 = { response: { status: 401 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();

        await expect(interceptor(error401)).rejects.toEqual(error401);
    });

    it("should reject if refresh fails and logoutFn is not set", async () => {
        const refreshFn = vi
            .fn<() => Promise<string | null>>()
            .mockRejectedValue(new Error("Refresh failed"));

        (client as unknown as { refreshFn: () => Promise<string | null> }).refreshFn = refreshFn;

        const error401 = { response: { status: 401 }, config: { headers: {} } };
        const interceptor = getResponseErrorInterceptor();

        await expect(interceptor(error401)).rejects.toThrow("Refresh failed");
    });

    it("should make get request and return data", async () => {
        mockInstance.get.mockResolvedValue({ data: { success: true } });
        const result = await client.get("/api/users/me");
        expect(mockInstance.get).toHaveBeenCalledWith("/api/users/me");
        expect(result).toEqual({ success: true });
    });
});
