<template>
    <ListPageLayout title="Serviços">
        <template #actions>
            <q-btn
                unelevated
                no-wrap
                label="Novo Serviço"
                color="primary"
                icon="add"
                @click="openCreate"
            />
        </template>

        <DataTable :table="table" :columns="columns">
            <template #body-cell-price="{ row, props }">
                <q-td :props="props" align="center">
                    {{ formatPrice(row.price) }}
                </q-td>
            </template>

            <template #body-cell-description="{ row, props }">
                <q-td :props="props" align="left">
                    <div class="description-clamp">
                        {{ row.description || "—" }}
                    </div>
                    <q-tooltip v-if="row.description">
                        {{ row.description }}
                    </q-tooltip>
                </q-td>
            </template>

            <template #body-cell-actions="{ row, props }">
                <q-td :props="props" align="center" class="q-gutter-x-xs">
                    <q-btn flat dense round icon="edit" color="primary" @click="openEdit(row)" />
                    <q-btn
                        flat
                        dense
                        round
                        icon="delete"
                        color="negative"
                        @click="openDelete(row)"
                    />
                </q-td>
            </template>

            <template #item="{ row }">
                <div class="q-pa-xs col-12">
                    <q-card flat bordered>
                        <q-card-section class="q-pb-sm">
                            <div class="row items-center justify-between">
                                <div class="text-subtitle1 text-weight-medium">{{ row.name }}</div>
                                <div class="text-subtitle1 text-weight-medium">
                                    {{ formatPrice(row.price) }}
                                </div>
                            </div>
                            <div
                                v-if="row.description"
                                class="description-clamp text-caption text-grey-7 q-mt-xs"
                            >
                                {{ row.description }}
                            </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="row items-center justify-between q-py-sm">
                            <div class="text-caption text-grey-8">
                                {{ formatDuration(row.durationInMinutes) }} ·
                                {{
                                    row.requiresVeterinarian
                                        ? "Requer veterinário"
                                        : "Sem veterinário"
                                }}
                            </div>
                            <div class="q-gutter-x-xs">
                                <q-btn
                                    flat
                                    dense
                                    round
                                    size="sm"
                                    icon="edit"
                                    color="primary"
                                    @click="openEdit(row)"
                                />
                                <q-btn
                                    flat
                                    dense
                                    round
                                    size="sm"
                                    icon="delete"
                                    color="negative"
                                    @click="openDelete(row)"
                                />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </template>
        </DataTable>

        <ConfirmDialog
            v-model="isDeleteOpen"
            title="Excluir serviço"
            :message="deleteMessage"
            icon="delete"
            confirm-label="Excluir"
            confirm-color="negative"
            :loading="isDeleting"
            @confirm="onDeleteConfirm"
        />

        <ServiceFormDialog
            v-model="isFormOpen"
            :service="selectedService"
            :is-loading="isSubmitting"
            @submit="onFormSubmit"
        />
    </ListPageLayout>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import type { QTableColumn } from "quasar";
import ListPageLayout from "@/components/common/ListPageLayout.vue";
import DataTable from "@/components/common/DataTable.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import { useDataTable } from "@/composables/useDataTable";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import type { CatalogService } from "@/application/services/catalogService";
import type { ServicePayload, VeterinaryService } from "@/domain/models/VeterinaryService";
import ServiceFormDialog from "@/components/forms/ServiceFormDialog.vue";

const $q = useQuasar();
const catalogService = container.resolve<CatalogService>("CatalogService");

const isDeleteOpen = ref(false);
const selectedService = ref<VeterinaryService | null>(null);
const isFormOpen = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const formatDuration = (minutes: number) => {
    if (minutes === 0) return "Sem duração fixa";
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
};

const columns: QTableColumn[] = [
    { name: "name", label: "Nome", field: "name", align: "left" },
    { name: "description", label: "Descrição", field: "description", align: "left" },
    {
        name: "durationInMinutes",
        label: "Duração",
        field: "durationInMinutes",
        align: "center",
        format: formatDuration,
    },
    { name: "price", label: "Preço", field: "price", align: "center" },
    {
        name: "requiresVeterinarian",
        label: "Requer Veterinário",
        field: "requiresVeterinarian",
        format: (val: boolean) => (val ? "Sim" : "Não"),
        align: "center",
    },
    { name: "actions", label: "Ações", field: "", align: "center" },
];

const table = useDataTable<VeterinaryService>((params) => catalogService.list(params), {
    onError: (error) =>
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao carregar serviços."),
        }),
});

void table.load();

const formatPrice = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const openCreate = () => {
    selectedService.value = null;
    isFormOpen.value = true;
};

const openEdit = (row: VeterinaryService) => {
    selectedService.value = row;
    isFormOpen.value = true;
};

const deleteMessage = computed(() =>
    selectedService.value
        ? `Deseja realmente excluir o serviço "${selectedService.value.name}"? Esta ação não pode ser desfeita.`
        : "",
);

const openDelete = (row: VeterinaryService) => {
    selectedService.value = row;
    isDeleteOpen.value = true;
};

const onDeleteConfirm = async () => {
    if (!selectedService.value) return;

    isDeleting.value = true;
    try {
        await catalogService.remove(selectedService.value.id);
        isDeleteOpen.value = false;
        $q.notify({
            type: "positive",
            message: "Serviço excluído com sucesso!",
        });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao excluir serviço."),
        });
    } finally {
        isDeleting.value = false;
    }
};

const onFormSubmit = async (payload: ServicePayload) => {
    isSubmitting.value = true;
    try {
        if (selectedService.value) {
            await catalogService.update(selectedService.value.id, payload);
        } else {
            await catalogService.register(payload);
        }
        isFormOpen.value = false;
        $q.notify({
            type: "positive",
            message: selectedService.value
                ? "Serviço atualizado com sucesso!"
                : "Serviço criado com sucesso!",
        });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao salvar serviço."),
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<style scoped>
.description-clamp {
    max-width: 280px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
