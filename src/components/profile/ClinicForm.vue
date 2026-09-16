<template>
    <div class="q-gutter-y-md">
        <q-form @submit="onSubmit">
            <q-input
                outlined
                v-model="form.clinicTradeName"
                label="Nome Fantasia"
                lazy-rules
                :rules="[required]"
            />
            <q-input
                outlined
                v-model="form.clinicLegalName"
                label="Razão Social"
                lazy-rules
                :rules="[required]"
            />
            <q-input
                outlined
                v-model="form.clinicDocumentNumber"
                label="CNPJ"
                :mask="cnpjMask"
                unmasked-value
                lazy-rules
                :rules="[required, cnpjFormat]"
            />
            <q-input
                outlined
                v-model="form.clinicEmail"
                label="E-mail da Clínica"
                lazy-rules
                :rules="[required, emailFormat]"
            />
            <q-input
                outlined
                v-model="form.clinicPhoneNumber"
                label="Telefone da Clínica"
                :mask="phoneMask"
                unmasked-value
                lazy-rules
                :rules="[required, phoneFormat]"
            />

            <div class="text-subtitle1 text-weight-medium text-grey-8 q-pt-md q-pb-sm">
                Endereço
            </div>
            <div class="row q-col-gutter-md">
                <q-input
                    outlined
                    class="col-xs-12 col-sm-6 col-md-4"
                    v-model="form.clinicZipCode"
                    label="CEP"
                    :mask="cepMask"
                    unmasked-value
                    lazy-rules
                    :rules="[required, cepFormat]"
                />
                <q-input
                    outlined
                    class="col-xs-12 col-sm-6 col-md-8"
                    v-model="form.clinicStreet"
                    label="Rua"
                    lazy-rules
                    :rules="[required]"
                />
                <q-input
                    outlined
                    class="col-xs-12 col-sm-4 col-md-4"
                    v-model="form.clinicNumber"
                    label="Número"
                    lazy-rules
                    :rules="[required]"
                />
                <q-input
                    outlined
                    class="col-xs-12 col-sm-8 col-md-8"
                    v-model="form.clinicNeighborhood"
                    label="Bairro"
                    lazy-rules
                    :rules="[required]"
                />
                <q-input
                    outlined
                    class="col-xs-12 col-sm-7 col-md-7"
                    v-model="form.clinicCity"
                    label="Cidade"
                    lazy-rules
                    :rules="[required]"
                />
                <q-input
                    outlined
                    class="col-xs-12 col-sm-5 col-md-5"
                    v-model="form.clinicState"
                    label="Estado"
                    lazy-rules
                    :rules="[required]"
                />
                <q-input
                    outlined
                    class="col-12"
                    v-model="form.clinicComplement"
                    label="Complemento"
                />
            </div>

            <div class="row justify-end q-mt-md">
                <q-btn
                    unelevated
                    label="Salvar Clínica"
                    type="submit"
                    color="primary"
                    :loading="isLoading"
                />
            </div>
        </q-form>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import type { Clinic, UpdateAccountPayload } from "@/domain/models/Auth";
import { useValidations } from "@/composables/useValidations";
import { useMasks } from "@/composables/useMasks";

const props = defineProps<{ clinic: Clinic | null | undefined; isLoading: boolean }>();
const emit = defineEmits<{ (e: "submit", payload: Partial<UpdateAccountPayload>): void }>();

const { phoneMask, cnpjMask, cepMask } = useMasks();
const { required, emailFormat, phoneFormat, cnpjFormat, cepFormat } = useValidations();

const form = ref<Partial<UpdateAccountPayload>>({
    clinicTradeName: "",
    clinicLegalName: "",
    clinicDocumentNumber: "",
    clinicEmail: "",
    clinicPhoneNumber: "",
    clinicZipCode: "",
    clinicStreet: "",
    clinicNumber: "",
    clinicNeighborhood: "",
    clinicComplement: "",
    clinicCity: "",
    clinicState: "",
});

watch(
    () => props.clinic,
    (newClinic) => {
        if (newClinic) {
            form.value.clinicTradeName = newClinic.tradeName || "";
            form.value.clinicLegalName = newClinic.legalName || "";
            form.value.clinicDocumentNumber = newClinic.documentNumber || "";
            form.value.clinicEmail = newClinic.email || "";
            form.value.clinicPhoneNumber = newClinic.phoneNumber || "";
            form.value.clinicZipCode = newClinic.zipCode || "";
            form.value.clinicStreet = newClinic.street || "";
            form.value.clinicNumber = newClinic.number || "";
            form.value.clinicNeighborhood = newClinic.neighborhood || "";
            form.value.clinicComplement = newClinic.complement || "";
            form.value.clinicCity = newClinic.city || "";
            form.value.clinicState = newClinic.state || "";
        }
    },
    { immediate: true },
);

const onSubmit = () => {
    emit("submit", form.value);
};
</script>
