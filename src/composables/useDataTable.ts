import { ref, type Ref } from "vue";
import type { FetchParams, PaginatedResponse } from "@/domain/models/pagination";

export interface TablePagination {
    sortBy?: string | null;
    descending?: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber?: number;
}

interface UseDataTableOptions {
    initialPerPage?: number;
    debounceMs?: number;
    onError?: (error: unknown) => void;
}

export const useDataTable = <T>(
    fetcher: (params: FetchParams) => Promise<PaginatedResponse<T>>,
    options: UseDataTableOptions = {},
) => {
    const rows: Ref<T[]> = ref([]);
    const loading = ref(false);
    const search = ref("");

    const pagination = ref<TablePagination>({
        page: 1,
        rowsPerPage: options.initialPerPage ?? 10,
        rowsNumber: 0,
    });

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
        loading.value = true;
        try {
            const response = await fetcher({
                pageNumber: pagination.value.page,
                pageSize: pagination.value.rowsPerPage,
                search: search.value,
            });
            rows.value = response.items;
            pagination.value = {
                ...pagination.value,
                rowsNumber: response.totalCount,
            };
        } catch (error) {
            if (options.onError) options.onError(error);
            else throw error;
        } finally {
            loading.value = false;
        }
    };

    const onRequest = (requestProps: { pagination: TablePagination }) => {
        const requested = requestProps.pagination;
        pagination.value = {
            sortBy: requested.sortBy ?? pagination.value.sortBy,
            descending: requested.descending ?? pagination.value.descending,
            page: requested.page,
            rowsPerPage: requested.rowsPerPage,
            rowsNumber: requested.rowsNumber ?? pagination.value.rowsNumber,
        };
        void load();
    };

    const onSearch = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            pagination.value.page = 1;
            void load();
        }, options.debounceMs ?? 300);
    };

    const setSearch = (value: string) => {
        search.value = value;
        onSearch();
    };

    const refresh = () => load();

    const setPagination = (value: TablePagination) => {
        pagination.value = value;
    };

    return {
        rows,
        loading,
        search,
        pagination,
        load,
        onRequest,
        onSearch,
        setSearch,
        setPagination,
        refresh,
    };
};

export type DataTableController<T> = ReturnType<typeof useDataTable<T>>;
