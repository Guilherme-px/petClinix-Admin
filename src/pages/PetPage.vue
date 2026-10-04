<template>
    <ListPageLayout title="Pets">
        <template #actions>
            <q-select
                outlined
                dense
                v-model="selectedTutorId"
                :options="tutorOptions"
                label="Selecione o Tutor"
                emit-value
                map-options
                style="min-width: 170px"
                @update:model-value="onTutorChange"
            />
            <div class="relative-position">
                <q-btn
                    unelevated
                    no-wrap
                    label="Novo Pet"
                    color="primary"
                    icon="add"
                    :disable="!selectedTutorId"
                    @click="openCreate"
                />
                <q-tooltip v-if="!selectedTutorId" class="text-caption">
                    Selecione um tutor!
                </q-tooltip>
            </div>
        </template>

        <EmptyState
            v-if="!selectedTutorId"
            :image="emptyPetsImage"
            title="Selecione um tutor"
            description="Escolha um tutor acima para visualizar os pets dele."
        />

        <EmptyState
            v-else-if="table.showEmptyState.value"
            :image="emptyPetsImage"
            title="Nenhum pet cadastrado"
            description="Cadastre o primeiro pet deste tutor."
        />

        <DataTable v-else :table="table" :columns="columns">
            <template #body-cell-species="{ row, props }">
                <q-td :props="props" align="center">
                    {{ SPECIES_LABELS[row.species as Species] ?? row.species }}
                </q-td>
            </template>

            <template #body-cell-sex="{ row, props }">
                <q-td :props="props" align="center">
                    {{ PET_SEX_LABELS[row.sex as PetSex] ?? row.sex }}
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
                                    {{ SPECIES_LABELS[row.species as Species] ?? row.species }}
                                </div>
                            </div>
                            <div v-if="row.breed" class="text-caption text-grey-7 q-mt-xs">
                                {{ row.breed }}
                            </div>
                        </q-card-section>
                        <q-separator />
                        <q-card-section class="row items-center justify-between q-py-sm">
                            <div class="text-caption text-grey-8">
                                {{ PET_SEX_LABELS[row.sex as PetSex] }} ·
                                {{ formatWeight(row.weight) }}
                                <template v-if="row.birthDate"> · {{ row.birthDate }}</template>
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
            title="Excluir pet"
            :message="deleteMessage"
            icon="delete"
            confirm-label="Excluir"
            confirm-color="negative"
            :loading="isDeleting"
            @confirm="onDeleteConfirm"
        />

        <PetFormDialog
            v-model="isFormOpen"
            :pet="selectedPet"
            :is-loading="isSubmitting"
            @submit="onFormSubmit"
        />
    </ListPageLayout>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import type { QTableColumn } from "quasar";
import ListPageLayout from "@/components/common/ListPageLayout.vue";
import DataTable from "@/components/common/DataTable.vue";
import ConfirmDialog from "@/components/common/ConfirmDialog.vue";
import PetFormDialog from "@/components/forms/PetFormDialog.vue";
import EmptyState from "@/components/common/EmptyState.vue";
import { useDataTable } from "@/composables/useDataTable";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import type { PetService } from "@/application/services/petService";
import type { TutorService } from "@/application/services/tutorService";
import type { Pet, PetPayload } from "@/domain/models/Pet";
import type { Species, PetSex } from "@/domain/models/Pet";
import { SPECIES_LABELS, PET_SEX_LABELS } from "@/domain/models/Pet";
import emptyPetsImage from "@/assets/pets.svg";

const $q = useQuasar();
const petService = container.resolve<PetService>("PetService");
const tutorService = container.resolve<TutorService>("TutorService");

const isDeleteOpen = ref(false);
const selectedPet = ref<Pet | null>(null);
const isFormOpen = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const selectedTutorId = ref<string | null>(null);

const tutorOptions = ref<{ label: string; value: string }[]>([]);

const columns: QTableColumn[] = [
    { name: "name", label: "Nome", field: "name", align: "left" },
    { name: "species", label: "Espécie", field: "species", align: "center" },
    { name: "breed", label: "Raça", field: "breed", align: "left" },
    { name: "sex", label: "Sexo", field: "sex", align: "center" },
    {
        name: "weight",
        label: "Peso (kg)",
        field: "weight",
        align: "center",
        format: (val: number | null) => (val != null ? `${val} kg` : "—"),
    },
    { name: "actions", label: "Ações", field: "", align: "center" },
];

const table = useDataTable<Pet>((params) => petService.list(selectedTutorId.value!, params), {
    onError: (error) =>
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao carregar pets."),
        }),
});

onMounted(async () => {
    try {
        const tutors = await tutorService.list({ pageNumber: 1, pageSize: 100, search: "" });
        tutorOptions.value = tutors.items.map((t) => ({ label: t.name, value: t.id }));
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao carregar tutores."),
        });
    }
});

const onTutorChange = (tutorId: string | null) => {
    selectedTutorId.value = tutorId;
    if (tutorId) {
        table.setPagination({ ...table.pagination.value, page: 1 });
        void table.load();
    }
};

const formatWeight = (weight: number | null) => (weight != null ? `${weight} kg` : "—");

const openCreate = () => {
    selectedPet.value = null;
    isFormOpen.value = true;
};

const openEdit = (row: Pet) => {
    selectedPet.value = row;
    isFormOpen.value = true;
};

const deleteMessage = computed(() =>
    selectedPet.value
        ? `Deseja realmente excluir o pet "${selectedPet.value.name}"? Esta ação não pode ser desfeita.`
        : "",
);

const openDelete = (row: Pet) => {
    selectedPet.value = row;
    isDeleteOpen.value = true;
};

const onDeleteConfirm = async () => {
    if (!selectedPet.value || !selectedTutorId.value) return;

    isDeleting.value = true;
    try {
        await petService.remove(selectedTutorId.value, selectedPet.value.id);
        isDeleteOpen.value = false;
        $q.notify({ type: "positive", message: "Pet excluído com sucesso!" });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao excluir pet."),
        });
    } finally {
        isDeleting.value = false;
    }
};

const onFormSubmit = async (payload: PetPayload) => {
    isSubmitting.value = true;
    try {
        if (selectedPet.value && selectedTutorId.value) {
            await petService.update(selectedTutorId.value, selectedPet.value.id, payload);
        } else if (selectedTutorId.value) {
            await petService.register(selectedTutorId.value, payload);
        }
        isFormOpen.value = false;
        $q.notify({
            type: "positive",
            message: selectedPet.value ? "Pet atualizado com sucesso!" : "Pet criado com sucesso!",
        });
        await table.refresh();
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao salvar pet."),
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>
