import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { Quasar, QCard } from "quasar";
import { h } from "vue";
import DataTable from "../../../components/common/DataTable.vue";
import { useDataTable } from "../../../composables/useDataTable";
import type { FetchParams, PaginatedResponse } from "../../../domain/models/pagination";
import type { VeterinaryService } from "../../../domain/models/VeterinaryService";

const screenState = { lt: { sm: false } };

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: () => ({ screen: screenState }),
    };
});

const mockService: VeterinaryService = {
    id: "service-1",
    name: "Banho e Tosa",
    description: "Higiene completa",
    durationInMinutes: 60,
    price: 90,
    requiresVeterinarian: false,
};

const mockResponse: PaginatedResponse<VeterinaryService> = {
    items: [mockService],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
};

const createController = async (response: PaginatedResponse<VeterinaryService> = mockResponse) => {
    const fetcher = vi
        .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
        .mockResolvedValue(response);
    const table = useDataTable<VeterinaryService>(fetcher);
    await table.load();
    return table;
};

describe("DataTable", () => {
    beforeEach(() => {
        screenState.lt.sm = false;
    });

    it("should render rows in table mode with column headers", async () => {
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [
                    { name: "name", label: "Nome", field: "name", align: "left" },
                    { name: "price", label: "Preço", field: "price", align: "center" },
                ],
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(true);
        expect(wrapper.text()).toContain("Nome");
        expect(wrapper.text()).toContain("Banho e Tosa");
    });

    it("should render search input inside table top", async () => {
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });

        const searchInput = wrapper.find('input[placeholder="Buscar..."]');
        expect(searchInput.exists()).toBe(true);
    });

    it("should call setSearch when typing in search input", async () => {
        const table = await createController();
        const setSearchSpy = vi.spyOn(table, "setSearch");

        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });

        await wrapper.find('input[placeholder="Buscar..."]').setValue("banho");

        expect(setSearchSpy).toHaveBeenCalledWith("banho");
    });

    it("should show empty state when no data and not loading", async () => {
        const emptyResponse: PaginatedResponse<VeterinaryService> = {
            ...mockResponse,
            items: [],
            totalCount: 0,
        };
        const table = await createController(emptyResponse);
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.text()).toContain("Nenhum registro encontrado");
    });

    it("should show loading state while fetching", () => {
        const fetcher = vi
            .fn<(params: FetchParams) => Promise<PaginatedResponse<VeterinaryService>>>()
            .mockReturnValue(new Promise(() => {}));
        const table = useDataTable<VeterinaryService>(fetcher);

        void table.load();
        mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });

        expect(table.loading.value).toBe(true);
    });

    it("should render custom item slot content in grid mode", async () => {
        screenState.lt.sm = true;
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            slots: {
                item: (slotProps: { row: VeterinaryService }) =>
                    h("div", { class: "custom-card" }, `CUSTOM ${slotProps.row.name}`),
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.find(".custom-card").exists()).toBe(true);
        expect(wrapper.find(".custom-card").text()).toContain("CUSTOM Banho e Tosa");
    });

    it("should render default generic card in grid mode when no item slot provided", async () => {
        screenState.lt.sm = true;
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [
                    { name: "name", label: "Nome", field: "name", align: "left" },
                    { name: "price", label: "Preço", field: "price", align: "center" },
                ],
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);
        expect(wrapper.findComponent(QCard).exists()).toBe(true);
        expect(wrapper.text()).toContain("Nome");
        expect(wrapper.text()).toContain("Banho e Tosa");
    });

    it("should apply grid-mode class to wrapper in grid mode", async () => {
        screenState.lt.sm = true;
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.find(".data-table-wrapper").classes()).toContain("grid-mode");
    });

    it("should pass through custom body slots in table mode", async () => {
        const table = await createController();
        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "price", label: "Preço", field: "price", align: "center" }],
            },
            slots: {
                "body-cell-price": () => h("td", "R$ CUSTOM"),
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        expect(wrapper.text()).toContain("R$ CUSTOM");
    });

    it("should emit request handler updates when pagination changes", async () => {
        const table = await createController();
        const onRequestSpy = vi.spyOn(table, "onRequest");

        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });
        await flushPromises();

        wrapper.findComponent({ name: "QTable" }).vm.$emit("request", {
            pagination: { page: 2, rowsPerPage: 10, rowsNumber: 100 },
        });
        await flushPromises();

        expect(onRequestSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                pagination: expect.objectContaining({ page: 2 }),
            }),
        );
    });

    it("should sync pagination model back to controller on v-model set", async () => {
        const table = await createController();
        const setPaginationSpy = vi.spyOn(table, "setPagination");

        const wrapper = mount(DataTable, {
            props: {
                table,
                columns: [{ name: "name", label: "Nome", field: "name", align: "left" }],
            },
            global: { plugins: [Quasar] },
        });

        wrapper.findComponent({ name: "QTable" }).vm.$emit("update:pagination", {
            page: 3,
            rowsPerPage: 25,
            rowsNumber: 100,
        });
        await flushPromises();

        expect(setPaginationSpy).toHaveBeenCalledWith(
            expect.objectContaining({ page: 3, rowsPerPage: 25 }),
        );
    });
});
