<template>
    <div class="data-table-wrapper" :class="{ 'grid-mode': isMobile }">
        <q-table
            flat
            bordered
            class="data-table bg-white"
            :rows="table.rows.value"
            :columns="columns"
            :loading="table.loading.value"
            v-model:pagination="paginationModel"
            :rows-per-page-options="[5, 10, 25, 50]"
            row-key="id"
            :grid="isMobile"
            :hide-header="isMobile"
            @request="table.onRequest"
        >
            <template #top>
                <q-input
                    outlined
                    dense
                    debounce="0"
                    class="search-input"
                    placeholder="Buscar..."
                    :model-value="table.search.value"
                    @update:model-value="(value) => table.setSearch(String(value ?? ''))"
                >
                    <template #append>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </template>

            <template v-for="(_, name) in passThroughSlots" :key="name" #[name]="slotProps">
                <slot :name="name" v-bind="slotProps ?? {}" />
            </template>

            <template #item="itemProps">
                <slot name="item" v-bind="itemProps ?? {}">
                    <div class="q-pa-xs col-12">
                        <q-card flat bordered class="q-pa-md">
                            <div v-for="col in itemProps.cols" :key="col.name" class="row q-py-xs">
                                <div class="col-5 text-caption text-grey-7">{{ col.label }}</div>
                                <div class="col-7 text-body2">{{ col.value }}</div>
                            </div>
                        </q-card>
                    </div>
                </slot>
            </template>

            <template #no-data>
                <div class="full-width row justify-center q-pa-lg text-grey-7">
                    {{ table.loading.value ? "Carregando..." : "Nenhum registro encontrado" }}
                </div>
            </template>
        </q-table>
    </div>
</template>

<script lang="ts" setup>
import { computed, useSlots } from "vue";
import { useQuasar } from "quasar";
import type { QTableColumn } from "quasar";
import type { DataTableController, TablePagination } from "@/composables/useDataTable";

const props = defineProps<{
    table: DataTableController<unknown>;
    columns: QTableColumn[];
}>();

const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.sm);

const paginationModel = computed<TablePagination>({
    get: () => props.table.pagination.value,
    set: (value) => props.table.setPagination(value),
});

const slots = useSlots();

const passThroughSlots = computed(() =>
    Object.fromEntries(Object.entries(slots).filter(([name]) => name !== "top-actions")),
);
</script>

<style scoped>
.data-table-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.data-table {
    min-width: 640px;
}

.data-table-wrapper.grid-mode .data-table {
    min-width: unset;
}

.search-input {
    width: 280px;
}

@media (max-width: 599px) {
    .search-input {
        width: 100%;
    }
}

.data-table-wrapper :deep(.q-table__top) {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
}

.data-table-wrapper :deep(.q-table thead tr th) {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

.data-table-wrapper :deep(.q-table thead tr) {
    background: #f5f5f5;
}

.data-table-wrapper :deep(.q-table tbody tr:nth-child(even)) {
    background: #fafafa;
}

.data-table-wrapper :deep(.q-table tbody td) {
    font-size: 0.875rem;
}

.data-table-wrapper :deep(.q-table__bottom) {
    border-top: 1px solid #f0f0f0;
    font-size: 0.8125rem;
}
</style>
