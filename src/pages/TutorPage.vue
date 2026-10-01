<template>
    <ListPageLayout title="Clientes">
        <template #actions>
            <q-btn
                unelevated
                no-wrap
                label="Novo Tutor"
                color="primary"
                icon="add"
                @click="openCreate"
            />
        </template>

        <EmptyState
            v-if="showEmptyState"
            :image="emptyTutorsImage"
            title="Nenhum tutor cadastrado"
            description="Cadastre o primeiro tutor para começar a atender seus clientes."
        />

        <DataTable ref="dataTableRef" v-else :table="table" :columns="columns">
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
                                <div class="text-caption text-grey-7">{{ formatCpf(row.cpf) }}</div>
                            </div>
                            <div v-if="row.email" class="text-caption text-grey-7 q-mt-xs">
                                {{ row.email }}
                            </div>
                            <div class="text-caption text-grey-7">
                                {{ row.city }}/{{ row.state }}
                            </div>
                        </q-card-section>
                        <q-card-section class="row items-center justify-between q-py-sm">
                            <div class="text-caption text-grey-8">
                                {{ formatPhone(row.phoneNumber) }}
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
            title="Excluir tutor"
            :message="deleteMessage"
            icon="delete"
            confirm-label="Excluir"
            confirm-color="negative"
            :loading="isDeleting"
            @confirm="onDeleteConfirm"
        />

        <TutorFormDialog
            v-model="isFormOpen"
            :tutor="selectedTutor"
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
import TutorFormDialog from "@/components/forms/TutorFormDialog.vue";
import { useDataTable } from "@/composables/useDataTable";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import type { TutorService } from "@/application/services/tutorService";
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";
import EmptyState from "@/components/common/EmptyState.vue";
import emptyTutorsImage from "@/assets/tutor.svg";
import { formatCpf, formatPhone } from "@/utils/formatters";

const $q = useQuasar();
const tutorService = container.resolve<TutorService>("TutorService");

const isDeleteOpen = ref(false);
const selectedTutor = ref<Tutor | null>(null);
const isFormOpen = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const dataTableRef = ref<InstanceType<typeof DataTable> | null>(null);

const columns: QTableColumn[] = [
    { name: "name", label: "Nome", field: "name", align: "left" },
    {
        name: "cpf",
        label: "CPF",
        field: "cpf",
        align: "center",
    },
    { name: "email", label: "E-mail", field: "email", align: "center" },
    {
        name: "phoneNumber",
        label: "Telefone",
        field: "phoneNumber",
        align: "center",
        format: formatPhone,
    },
    { name: "actions", label: "Ações", field: "", align: "center" },
];

const table = useDataTable<Tutor>((params) => tutorService.list(params), {
    onError: (error) =>
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao carregar tutores."),
        }),
});

void table.load();

const openCreate = () => {
    selectedTutor.value = null;
    isFormOpen.value = true;
};

const openEdit = (row: Tutor) => {
    selectedTutor.value = row;
    isFormOpen.value = true;
};

const deleteMessage = computed(() =>
    selectedTutor.value
        ? `Deseja realmente excluir o tutor "${selectedTutor.value.name}"? Esta ação não pode ser desfeita.`
        : "",
);

const showEmptyState = computed(() => dataTableRef.value?.showEmptyState ?? false);

const openDelete = (row: Tutor) => {
    selectedTutor.value = row;
    isDeleteOpen.value = true;
};

const onDeleteConfirm = async () => {
    if (!selectedTutor.value) return;

    isDeleting.value = true;
    try {
        await tutorService.remove(selectedTutor.value.id);
        isDeleteOpen.value = false;
        $q.notify({ type: "positive", message: "Tutor excluído com sucesso!" });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao excluir tutor."),
        });
    } finally {
        isDeleting.value = false;
    }
};

const onFormSubmit = async (payload: RegisterTutorPayload | UpdateTutorPayload) => {
    isSubmitting.value = true;
    try {
        if (selectedTutor.value) {
            await tutorService.update(selectedTutor.value.id, payload as UpdateTutorPayload);
        } else {
            await tutorService.register(payload as RegisterTutorPayload);
        }
        isFormOpen.value = false;
        $q.notify({
            type: "positive",
            message: selectedTutor.value
                ? "Tutor atualizado com sucesso!"
                : "Tutor criado com sucesso!",
        });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao salvar tutor."),
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>
