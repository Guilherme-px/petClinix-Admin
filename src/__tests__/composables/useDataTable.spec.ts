import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDataTable, type TablePagination } from "../../composables/useDataTable";
import type { FetchParams, PaginatedResponse } from "../../domain/models/pagination";
import type { VeterinaryService } from "../../domain/models/VeterinaryService";

describe("useDataTable", () => {
    const mockItem: VeterinaryService = {
        id: "service-1",
        name: "Banho e Tosa",
        description: "Higiene completa",
        durationInMinutes: 60,
        price: 90,
        requiresVeterinarian: false,
    };

    const mockResponse: PaginatedResponse<VeterinaryService> = {
        items: [mockItem],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
    };

    const createFetcher = (response: PaginatedResponse<VeterinaryService> = mockResponse) =>
        vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockResolvedValue(response);

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should initialize with default pagination and empty state", () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);

        expect(table.rows.value).toEqual([]);
        expect(table.loading.value).toBe(false);
        expect(table.search.value).toBe("");
        expect(table.pagination.value).toEqual({
            page: 1,
            rowsPerPage: 10,
            rowsNumber: 0,
        });
    });

    it("should initialize with custom rowsPerPage", () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher, { initialPerPage: 5 });

        expect(table.pagination.value.rowsPerPage).toBe(5);
    });

    it("should load rows and update rowsNumber on load", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);

        await table.load();

        expect(fetcher).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 10,
            search: "",
        });
        expect(table.rows.value).toEqual([mockItem]);
        expect(table.pagination.value.rowsNumber).toBe(1);
        expect(table.loading.value).toBe(false);
    });

    it("should set loading true during load and false after", async () => {
        let resolveFetch!: (value: PaginatedResponse<VeterinaryService>) => void;
        const fetcher = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockReturnValue(
                new Promise<PaginatedResponse<VeterinaryService>>((resolve) => {
                    resolveFetch = resolve;
                }),
            );

        const table = useDataTable<VeterinaryService>(fetcher);

        const loadPromise = table.load();

        expect(table.loading.value).toBe(true);

        resolveFetch(mockResponse);
        await loadPromise;

        expect(table.loading.value).toBe(false);
    });

    it("should call onError and not throw when load fails with handler", async () => {
        const onError = vi.fn<(error: unknown) => void>();
        const fetcher = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockRejectedValue(new Error("Network Error"));

        const table = useDataTable<VeterinaryService>(fetcher, { onError });

        await expect(table.load()).resolves.toBeUndefined();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(table.loading.value).toBe(false);
    });

    it("should rethrow when load fails without onError", async () => {
        const fetcher = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockRejectedValue(new Error("Network Error"));

        const table = useDataTable<VeterinaryService>(fetcher);

        await expect(table.load()).rejects.toThrow("Network Error");
        expect(table.loading.value).toBe(false);
    });

    it("should update pagination and reload on request", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);
        await table.load();
        fetcher.mockClear();

        const newPagination: TablePagination = {
            page: 2,
            rowsPerPage: 25,
            rowsNumber: 100,
        };

        await table.onRequest({ pagination: newPagination });

        expect(table.pagination.value.page).toBe(2);
        expect(table.pagination.value.rowsPerPage).toBe(25);
        expect(fetcher).toHaveBeenCalledWith({
            pageNumber: 2,
            pageSize: 25,
            search: "",
        });
    });

    it("should preserve previous sortBy and descending when request omits them", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);
        await table.load();

        table.setPagination({
            page: 1,
            rowsPerPage: 10,
            rowsNumber: 10,
            sortBy: "name",
            descending: true,
        });

        await table.onRequest({
            pagination: { page: 3, rowsPerPage: 10, rowsNumber: 10 },
        });

        expect(table.pagination.value.sortBy).toBe("name");
        expect(table.pagination.value.descending).toBe(true);
        expect(table.pagination.value.page).toBe(3);
    });

    it("should preserve previous sortBy, descending and rowsNumber when request omits them", async () => {
        const fetcher = createFetcher({ ...mockResponse, totalCount: 10 });
        const table = useDataTable<VeterinaryService>(fetcher);
        await table.load();

        table.setPagination({
            page: 1,
            rowsPerPage: 10,
            rowsNumber: 10,
            sortBy: "name",
            descending: true,
        });

        await table.onRequest({
            pagination: { page: 3, rowsPerPage: 10 },
        });

        expect(table.pagination.value.sortBy).toBe("name");
        expect(table.pagination.value.descending).toBe(true);
        expect(table.pagination.value.rowsNumber).toBe(10);
        expect(table.pagination.value.page).toBe(3);
    });

    it("should debounce search and reset page to 1", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);

        table.setSearch("banho");
        expect(table.search.value).toBe("banho");

        expect(fetcher).not.toHaveBeenCalledTimes(2);
        expect(table.pagination.value.page).toBe(1);

        await vi.advanceTimersByTimeAsync(300);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenLastCalledWith({
            pageNumber: 1,
            pageSize: 10,
            search: "banho",
        });
    });

    it("should debounce multiple rapid searches into a single call", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);

        table.setSearch("b");
        await vi.advanceTimersByTimeAsync(100);

        table.setSearch("ba");
        await vi.advanceTimersByTimeAsync(100);

        table.setSearch("banho");
        await vi.advanceTimersByTimeAsync(299);

        expect(fetcher).not.toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher).toHaveBeenLastCalledWith({
            pageNumber: 1,
            pageSize: 10,
            search: "banho",
        });
    });

    it("should respect custom debounce time", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher, { debounceMs: 500 });

        table.setSearch("teste");
        await vi.advanceTimersByTimeAsync(300);
        expect(fetcher).not.toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(200);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it("should reset to page 1 before searching when on a later page", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);

        table.setPagination({ page: 3, rowsPerPage: 10, rowsNumber: 100 });
        table.setSearch("filtro");

        await vi.advanceTimersByTimeAsync(300);

        expect(table.pagination.value.page).toBe(1);
        expect(fetcher).toHaveBeenLastCalledWith({
            pageNumber: 1,
            pageSize: 10,
            search: "filtro",
        });
    });

    it("should update pagination without loading on setPagination", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);
        await table.load();
        fetcher.mockClear();

        table.setPagination({
            page: 2,
            rowsPerPage: 50,
            rowsNumber: 42,
            sortBy: "price",
        });

        expect(table.pagination.value).toEqual({
            page: 2,
            rowsPerPage: 50,
            rowsNumber: 42,
            sortBy: "price",
        });
        expect(fetcher).not.toHaveBeenCalled();
    });

    it("should reload on refresh", async () => {
        const fetcher = createFetcher();
        const table = useDataTable<VeterinaryService>(fetcher);
        await table.load();
        fetcher.mockClear();

        await table.refresh();

        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});
