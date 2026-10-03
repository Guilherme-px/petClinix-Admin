<template>
    <q-dialog v-model="model" persistent>
        <q-card class="pet-form-card">
            <q-card-section class="text-h6">
                {{ isEdit ? "Editar Pet" : "Novo Pet" }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-card-section class="row q-col-gutter-md">
                    <q-input
                        outlined
                        class="col-12"
                        v-model="form.name"
                        label="Nome"
                        lazy-rules
                        :rules="[required]"
                    />

                    <q-select
                        outlined
                        class="col-xs-12 col-sm-6"
                        v-model="form.species"
                        :options="SPECIES_OPTIONS"
                        label="Espécie"
                        emit-value
                        map-options
                        lazy-rules
                        :rules="[required]"
                    />
                    <q-select
                        outlined
                        class="col-xs-12 col-sm-6"
                        v-model="form.sex"
                        :options="PET_SEX_OPTIONS"
                        label="Sexo"
                        emit-value
                        map-options
                        lazy-rules
                        :rules="[required]"
                    />

                    <q-input
                        outlined
                        class="col-xs-12 col-sm-6"
                        v-model="form.breed"
                        label="Raça"
                    />
                    <q-input
                        outlined
                        class="col-xs-12 col-sm-6"
                        v-model="form.birthDate"
                        label="Data de Nascimento"
                        type="date"
                        stack-label
                    />

                    <q-input
                        outlined
                        class="col-xs-12 col-sm-6"
                        v-model.number="form.weight"
                        label="Peso (kg)"
                        type="number"
                        step="0.01"
                        min="0"
                    />
                    <q-toggle
                        v-model="form.isNeutered"
                        label="Castrado"
                        class="col-xs-12 col-sm-6"
                    />

                    <q-input
                        outlined
                        class="col-12"
                        v-model="form.notes"
                        label="Observações"
                        type="textarea"
                        autogrow
                    />
                </q-card-section>

                <q-card-actions align="between" class="q-px-md q-pb-md">
                    <q-btn
                        flat
                        label="Cancelar"
                        color="grey-7"
                        :disable="isLoading"
                        v-close-popup
                    />
                    <q-btn
                        unelevated
                        :label="isEdit ? 'Atualizar' : 'Salvar'"
                        color="primary"
                        type="submit"
                        :loading="isLoading"
                    />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import type { Pet, PetPayload } from "@/domain/models/Pet";
import { SPECIES_OPTIONS, PET_SEX_OPTIONS } from "@/domain/models/Pet";
import { useValidations } from "@/composables/useValidations";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    pet: Pet | null;
    isLoading: boolean;
}>();

const emit = defineEmits<{ (e: "submit", payload: PetPayload): void }>();

const { required } = useValidations();

const isEdit = computed(() => !!props.pet);

const emptyForm = (): PetPayload => ({
    name: "",
    species: "Dog",
    breed: null,
    birthDate: null,
    sex: "Male",
    weight: null,
    isNeutered: false,
    notes: null,
});

const form = ref<PetPayload>(emptyForm());

watch(
    [model, () => props.pet],
    ([open, pet]) => {
        if (!open) return;
        form.value = pet
            ? {
                  name: pet.name,
                  species: pet.species,
                  breed: pet.breed,
                  birthDate: pet.birthDate,
                  sex: pet.sex,
                  weight: pet.weight,
                  isNeutered: pet.isNeutered,
                  notes: pet.notes,
              }
            : emptyForm();
    },
    { immediate: true },
);

const onSubmit = () => {
    emit("submit", {
        ...form.value,
        name: form.value.name.trim(),
        breed: form.value.breed?.trim() || null,
        notes: form.value.notes?.trim() || null,
    });
};
</script>

<style scoped>
.pet-form-card {
    width: 100%;
    max-width: 560px;
}
</style>
