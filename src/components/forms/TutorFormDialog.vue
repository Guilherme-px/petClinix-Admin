<template>
    <q-dialog v-model="model" persistent>
        <q-card class="tutor-form-card">
            <q-card-section class="text-h6">
                {{ isEdit ? "Editar Tutor" : "Novo Tutor" }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-list>
                    <q-expansion-item
                        icon="person"
                        label="Dados Pessoais"
                        default-opened
                        class="expansion-section"
                    >
                        <q-card-section class="row q-col-gutter-md">
                            <q-input
                                outlined
                                class="col-12"
                                v-model="form.name"
                                label="Nome Completo"
                                lazy-rules
                                :rules="[required]"
                            />

                            <q-input
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.cpf"
                                label="CPF"
                                :mask="cpfMask"
                                unmasked-value
                                :disable="isEdit"
                                lazy-rules
                                :rules="[required, cpfFormat]"
                            />
                            <q-input
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.email"
                                label="E-mail"
                                lazy-rules
                                :rules="[emailFormat]"
                            />

                            <q-input
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.phoneNumber"
                                label="Telefone"
                                :mask="phoneMask"
                                unmasked-value
                                lazy-rules
                                :rules="[required, phoneFormat]"
                            />
                            <q-input
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.secondaryPhoneNumber"
                                label="Telefone Secundário"
                                :mask="phoneMask"
                                unmasked-value
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
                    </q-expansion-item>

                    <q-separator />

                    <q-expansion-item
                        icon="location_on"
                        label="Endereço"
                        caption="Obrigatório para cadastro"
                        class="expansion-section"
                    >
                        <q-card-section class="row q-col-gutter-md">
                            <q-input
                                outlined
                                class="col-6 col-sm-3"
                                v-model="form.zipCode"
                                label="CEP"
                                :mask="cepMask"
                                unmasked-value
                                lazy-rules
                                :rules="[required, cepFormat]"
                            />
                            <q-input
                                outlined
                                class="col-12 col-sm-9"
                                v-model="form.street"
                                label="Rua"
                                lazy-rules
                                :rules="[required]"
                            />

                            <q-input
                                outlined
                                class="col-4 col-sm-3"
                                v-model="form.number"
                                label="Número"
                                lazy-rules
                                :rules="[required]"
                            />
                            <q-input
                                outlined
                                class="col-8 col-sm-4"
                                v-model="form.neighborhood"
                                label="Bairro"
                                lazy-rules
                                :rules="[required]"
                            />
                            <q-input
                                outlined
                                class="col-12 col-sm-5"
                                v-model="form.complement"
                                label="Complemento"
                            />

                            <q-input
                                outlined
                                class="col-8 col-sm-9"
                                v-model="form.city"
                                label="Cidade"
                                lazy-rules
                                :rules="[required]"
                            />
                            <q-input
                                outlined
                                class="col-4 col-sm-3"
                                v-model="form.state"
                                label="Estado"
                                lazy-rules
                                :rules="[required]"
                            />
                        </q-card-section>
                    </q-expansion-item>
                </q-list>

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
import type { Tutor, RegisterTutorPayload, UpdateTutorPayload } from "@/domain/models/Tutor";
import { useValidations } from "@/composables/useValidations";
import { useMasks } from "@/composables/useMasks";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    tutor: Tutor | null;
    isLoading: boolean;
}>();

const emit = defineEmits<{
    (e: "submit", payload: RegisterTutorPayload | UpdateTutorPayload): void;
}>();

const { required, emailFormat, cpfFormat, phoneFormat, cepFormat } = useValidations();
const { cpfMask, phoneMask, cepMask } = useMasks();

const isEdit = computed(() => !!props.tutor);

const emptyForm = (): RegisterTutorPayload => ({
    name: "",
    cpf: "",
    email: null,
    phoneNumber: "",
    secondaryPhoneNumber: null,
    zipCode: "",
    street: "",
    number: "",
    neighborhood: "",
    complement: null,
    city: "",
    state: "",
    notes: null,
});

const form = ref<RegisterTutorPayload>(emptyForm());

watch(
    [model, () => props.tutor],
    ([open, tutor]) => {
        if (!open) return;
        form.value = tutor
            ? {
                  name: tutor.name,
                  cpf: tutor.cpf,
                  email: tutor.email,
                  phoneNumber: tutor.phoneNumber,
                  secondaryPhoneNumber: tutor.secondaryPhoneNumber,
                  zipCode: tutor.zipCode,
                  street: tutor.street,
                  number: tutor.number,
                  neighborhood: tutor.neighborhood,
                  complement: tutor.complement,
                  city: tutor.city,
                  state: tutor.state,
                  notes: tutor.notes,
              }
            : emptyForm();
    },
    { immediate: true },
);

const onSubmit = () => {
    const base = {
        name: form.value.name.trim(),
        email: form.value.email?.trim() || null,
        phoneNumber: form.value.phoneNumber,
        secondaryPhoneNumber: form.value.secondaryPhoneNumber?.trim() || null,
        zipCode: form.value.zipCode,
        street: form.value.street.trim(),
        number: form.value.number.trim(),
        neighborhood: form.value.neighborhood.trim(),
        complement: form.value.complement?.trim() || null,
        city: form.value.city.trim(),
        state: form.value.state.trim(),
        notes: form.value.notes?.trim() || null,
    };

    if (!props.tutor) {
        emit("submit", { ...base, cpf: form.value.cpf });
    } else {
        emit("submit", base);
    }
};
</script>

<style scoped>
.tutor-form-card {
    width: 100%;
    max-width: 760px;
}

.expansion-section {
    border-radius: 8px;
}
</style>
