import { vi } from "vitest";
import { HttpClient } from "@/infrastructure/http/HttpClient";

export function createHttpClientMock(): HttpClient {
    return {
        get: vi.fn<(url: string) => Promise<unknown>>(),
        post: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
        put: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
        delete: vi.fn<(url: string) => Promise<unknown>>(),
        setAuthHandlers:
            vi.fn<(refreshFn: () => Promise<string | null>, logoutFn: () => void) => void>(),
    } as unknown as HttpClient;
}
