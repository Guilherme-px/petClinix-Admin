<template>
    <ListPageLayout title="Profissionais">
        <template #actions>
            <q-btn
                unelevated
                no-wrap
                label="Novo Profissional"
                color="primary"
                icon="add"
                @click="openCreate"
            />
        </template>

        <EmptyState
            v-if="table.showEmptyState.value"
            :image="emptyStaffImage"
            title="Nenhum profissional cadastrado"
            description="Cadastre o primeiro profissional para começar a atender seus clientes."
        />

        <DataTable v-else :table="table" :columns="columns">
            <template #body-cell-role="{ row, props }">
                <q-td :props="props" align="center">
                    {{ STAFF_ROLE_LABELS[row.role as StaffRole] ?? row.role }}
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
                                <div class="text-caption text-grey-7">
                                    {{ STAFF_ROLE_LABELS[row.role as StaffRole] ?? row.role }}
                                </div>
                            </div>
                            <div class="text-caption text-grey-7 q-mt-xs">{{ row.email }}</div>
                        </q-card-section>
                        <q-separator />
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
            title="Excluir profissional"
            :message="deleteMessage"
            icon="delete"
            confirm-label="Excluir"
            confirm-color="negative"
            :loading="isDeleting"
            @confirm="onDeleteConfirm"
        />

        <StaffFormDialog
            v-model="isFormOpen"
            :staff="selectedStaff"
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
import StaffFormDialog from "@/components/forms/StaffFormDialog.vue";
import { useDataTable } from "@/composables/useDataTable";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import type { StaffService } from "@/application/services/staffService";
import type {
    StaffMember,
    StaffRole,
    RegisterStaffPayload,
    UpdateStaffPayload,
} from "@/domain/models/Staff";
import { STAFF_ROLE_LABELS } from "@/domain/models/Staff";
import EmptyState from "@/components/common/EmptyState.vue";
import emptyStaffImage from "@/assets/empty-staff.svg";
import { formatPhone } from "@/utils/formatters";

const $q = useQuasar();
const staffService = container.resolve<StaffService>("StaffService");

const isDeleteOpen = ref(false);
const selectedStaff = ref<StaffMember | null>(null);
const isFormOpen = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);

const columns: QTableColumn[] = [
    { name: "name", label: "Nome", field: "name", align: "left" },
    { name: "email", label: "E-mail", field: "email", align: "left" },
    {
        name: "role",
        label: "Cargo",
        field: "role",
        align: "center",
    },
    {
        name: "phoneNumber",
        label: "Telefone",
        field: "phoneNumber",
        align: "center",
        format: formatPhone,
    },
    { name: "actions", label: "Ações", field: "", align: "center" },
];

const table = useDataTable<StaffMember>((params) => staffService.list(params), {
    onError: (error) =>
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao carregar profissionais."),
        }),
});

void table.load();

const openCreate = () => {
    selectedStaff.value = null;
    isFormOpen.value = true;
};

const openEdit = (row: StaffMember) => {
    selectedStaff.value = row;
    isFormOpen.value = true;
};

const deleteMessage = computed(() =>
    selectedStaff.value
        ? `Deseja realmente excluir o profissional "${selectedStaff.value.name}"? Esta ação não pode ser desfeita.`
        : "",
);

const openDelete = (row: StaffMember) => {
    selectedStaff.value = row;
    isDeleteOpen.value = true;
};

const onDeleteConfirm = async () => {
    if (!selectedStaff.value) return;

    isDeleting.value = true;
    try {
        await staffService.remove(selectedStaff.value.id);
        isDeleteOpen.value = false;
        $q.notify({ type: "positive", message: "Profissional excluído com sucesso!" });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao excluir profissional."),
        });
    } finally {
        isDeleting.value = false;
    }
};

const onFormSubmit = async (payload: RegisterStaffPayload | UpdateStaffPayload) => {
    isSubmitting.value = true;
    try {
        if (selectedStaff.value) {
            await staffService.update(selectedStaff.value.id, payload as UpdateStaffPayload);
        } else {
            await staffService.register(payload as RegisterStaffPayload);
        }
        isFormOpen.value = false;
        $q.notify({
            type: "positive",
            message: selectedStaff.value
                ? "Profissional atualizado com sucesso!"
                : "Profissional criado com sucesso!",
        });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao salvar profissional."),
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>
