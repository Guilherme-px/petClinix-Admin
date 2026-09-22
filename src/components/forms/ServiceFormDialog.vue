<template>
    <q-dialog v-model="model" persistent>
        <q-card class="service-form-card">
            <q-card-section class="text-h6">
                {{ isEdit ? "Editar Serviço" : "Novo Serviço" }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-card-section class="q-gutter-y-md">
                    <q-input
                        outlined
                        v-model="form.name"
                        label="Nome"
                        lazy-rules
                        :rules="[required]"
                    />
                    <q-input
                        outlined
                        v-model.number="form.durationInMinutes"
                        label="Duração (min)"
                        type="number"
                        min="0"
                        lazy-rules
                        :rules="[positiveNumber]"
                    />
                    <q-input
                        outlined
                        v-model.number="form.price"
                        label="Preço (R$)"
                        type="number"
                        step="0.01"
                        min="0.01"
                        lazy-rules
                        :rules="[positiveNumber]"
                    />
                    <q-input
                        outlined
                        v-model="form.description"
                        label="Descrição"
                        type="textarea"
                        autogrow
                    />

                    <q-toggle v-model="form.requiresVeterinarian">
                        <div class="row items-center no-wrap">
                            Requer veterinário
                            <q-icon
                                name="info"
                                size="18px"
                                color="grey-7"
                                class="q-ml-xs cursor-pointer"
                            >
                                <q-tooltip max-width="280px" class="text-body2">
                                    Desmarque quando o serviço não ocupar tempo da agenda do
                                    veterinário, como internações e exames realizados por terceiros.
                                </q-tooltip>
                            </q-icon>
                        </div>
                    </q-toggle>
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
import type { VeterinaryService, ServicePayload } from "@/domain/models/VeterinaryService";
import { useValidations } from "@/composables/useValidations";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    service: VeterinaryService | null;
    isLoading: boolean;
}>();

const emit = defineEmits<{ (e: "submit", payload: ServicePayload): void }>();

const { required, positiveNumber } = useValidations();

const isEdit = computed(() => !!props.service);

const emptyForm = (): ServicePayload => ({
    name: "",
    description: null,
    durationInMinutes: 0,
    price: 0,
    requiresVeterinarian: false,
});

const form = ref<ServicePayload>(emptyForm());

watch(
    [model, () => props.service],
    ([open, service]) => {
        if (!open) return;
        form.value = service
            ? {
                  name: service.name,
                  description: service.description,
                  durationInMinutes: service.durationInMinutes,
                  price: service.price,
                  requiresVeterinarian: service.requiresVeterinarian,
              }
            : emptyForm();
    },
    { immediate: true },
);

const onSubmit = () => {
    const description = form.value.description?.trim() || null;
    emit("submit", { ...form.value, description });
};
</script>

<style scoped>
.service-form-card {
    width: 100%;
    max-width: 480px;
}
</style>
