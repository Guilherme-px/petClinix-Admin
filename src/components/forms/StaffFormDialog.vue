<template>
    <q-dialog v-model="model" persistent>
        <q-card class="staff-form-card">
            <q-card-section class="text-h6">
                {{ isEdit ? "Editar Profissional" : "Novo Profissional" }}
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
                        v-model="form.email"
                        label="E-mail"
                        :disable="isEdit"
                        lazy-rules
                        :rules="[required, emailFormat]"
                    />
                    <q-input
                        outlined
                        v-model="form.documentNumber"
                        label="CPF"
                        :mask="cpfMask"
                        unmasked-value
                        :disable="isEdit"
                        lazy-rules
                        :rules="[required, cpfFormat]"
                    />
                    <q-input
                        outlined
                        v-model="form.phoneNumber"
                        label="Telefone"
                        :mask="phoneMask"
                        unmasked-value
                        lazy-rules
                        :rules="[required, phoneFormat]"
                    />
                    <q-input
                        outlined
                        v-model="form.birthDate"
                        label="Data de Nascimento"
                        type="date"
                        stack-label
                        lazy-rules
                        :rules="[required]"
                    />
                    <q-select
                        outlined
                        v-model="form.role"
                        :options="STAFF_ROLE_OPTIONS"
                        label="Cargo"
                        emit-value
                        map-options
                        lazy-rules
                        :rules="[required]"
                    />
                </q-card-section>

                <q-card-actions align="between" class="q-px-md q-pb-md">
                    <q-btn flat label="Cancelar" color="grey-7" :disable="isLoading" v-close-popup />
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
import type { StaffMember, RegisterStaffPayload, UpdateStaffPayload } from "@/domain/models/Staff";
import { STAFF_ROLE_OPTIONS } from "@/domain/models/Staff";
import { useValidations } from "@/composables/useValidations";
import { useMasks } from "@/composables/useMasks";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    staff: StaffMember | null;
    isLoading: boolean;
}>();

const emit = defineEmits<{
    (e: "submit", payload: RegisterStaffPayload | UpdateStaffPayload): void;
}>();

const { required, emailFormat, cpfFormat, phoneFormat } = useValidations();
const { cpfMask, phoneMask } = useMasks();

const isEdit = computed(() => !!props.staff);

const emptyForm = (): RegisterStaffPayload => ({
    name: "",
    email: "",
    documentNumber: "",
    phoneNumber: "",
    birthDate: "",
    role: "Receptionist",
});

const form = ref<RegisterStaffPayload>(emptyForm());

watch(
    [model, () => props.staff],
    ([open, staff]) => {
        if (!open) return;
        form.value = staff
            ? {
                  name: staff.name,
                  email: staff.email,
                  documentNumber: staff.documentNumber,
                  phoneNumber: staff.phoneNumber,
                  birthDate: staff.birthDate,
                  role: staff.role,
              }
            : emptyForm();
    },
    { immediate: true },
);

const onSubmit = () => {
    const base = {
        name: form.value.name.trim(),
        phoneNumber: form.value.phoneNumber,
        birthDate: form.value.birthDate,
        role: form.value.role,
    };

    if (!props.staff) {
        emit("submit", { ...base, email: form.value.email, documentNumber: form.value.documentNumber });
    } else {
        emit("submit", base);
    }
};
</script>

<style scoped>
.staff-form-card {
    width: 100%;
    max-width: 480px;
}
</style>
