import { vi, type Mock } from "vitest";

export type HttpClientMock = {
    get: Mock<(url: string) => Promise<unknown>>;
    post: Mock<(url: string, data: unknown) => Promise<unknown>>;
    put: Mock<(url: string, data: unknown) => Promise<unknown>>;
    delete: Mock<(url: string) => Promise<unknown>>;
    setAuthHandlers: Mock<(refreshFn: () => Promise<string | null>, logoutFn: () => void) => void>;
};

export function createHttpClientMock(): HttpClientMock {
    return {
        get: vi.fn<(url: string) => Promise<unknown>>(),
        post: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
        put: vi.fn<(url: string, data: unknown) => Promise<unknown>>(),
        delete: vi.fn<(url: string) => Promise<unknown>>(),
        setAuthHandlers:
            vi.fn<(refreshFn: () => Promise<string | null>, logoutFn: () => void) => void>(),
    };
}
