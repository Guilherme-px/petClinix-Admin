<template>
    <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input outlined v-model="form.userName" label="Nome Completo" lazy-rules :rules="[required]" />
        <q-input outlined v-model="form.userPhoneNumber" label="Telefone" lazy-rules :rules="[required]" />
        <q-input outlined v-model="form.userBirthDate" label="Data de Nascimento" type="date" stack-label />
        <q-input outlined :model-value="user?.email" label="E-mail" disable hint="O e-mail não pode ser alterado" />
        <q-input outlined :model-value="user?.documentNumber" label="CPF" disable hint="O CPF não pode ser alterado" />

        <q-separator class="q-my-md" />
        <div class="text-subtitle2 text-grey-7">Alterar Senha (deixe em branco para manter a atual)</div>

        <q-input
            outlined
            v-model="form.newPassword"
            label="Nova Senha"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[optionalPasswordRules]"
        >
            <template v-slot:append>
                <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                />
            </template>
        </q-input>
        <q-input
            outlined
            v-model="confirmNewPassword"
            label="Confirmar Nova Senha"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[confirmPasswordRules(form.newPassword || '')]"
        />

        <div class="row justify-end">
            <q-btn unelevated label="Salvar Alterações" type="submit" color="primary" :loading="isLoading" />
        </div>
    </q-form>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import type { User, UpdateAccountPayload } from "@/domain/models/Auth";
import { useValidations } from "@/composables/useValidations";

const props = defineProps<{ user: User | null; isLoading: boolean }>();
const emit = defineEmits<{ (e: "submit", payload: Partial<UpdateAccountPayload>): void }>();

const { required, optionalPasswordRules, confirmPasswordRules } = useValidations();

const isPwd = ref(true);
const confirmNewPassword = ref("");

const form = ref<Partial<UpdateAccountPayload>>({
    userName: "",
    userPhoneNumber: "",
    userBirthDate: "",
    newPassword: ""
});

watch(() => props.user, (newUser) => {
    if (newUser) {
        form.value.userName = newUser.name || "";
        form.value.userPhoneNumber = newUser.phoneNumber || "";
        form.value.userBirthDate = newUser.birthDate || "";
    }
}, { immediate: true });

const onSubmit = () => {
    if (!form.value.newPassword) {
        delete form.value.newPassword;
    } else if (form.value.newPassword !== confirmNewPassword.value) {
        return;
    }
    emit("submit", form.value);
};
</script>
