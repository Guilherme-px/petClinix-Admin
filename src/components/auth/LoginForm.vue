<template>
    <q-form @submit="onSubmit" class="q-gutter-md" data-test="login-form">
        <q-input
            outlined
            v-model="form.email"
            label="E-mail"
            type="email"
            lazy-rules
            :rules="[required, emailFormat]"
            data-test="email-input"
        >
            <template v-slot:prepend>
                <q-icon name="email" />
            </template>
        </q-input>

        <q-input
            outlined
            v-model="form.password"
            label="Senha"
            :type="isPwd ? 'password' : 'text'"
            lazy-rules
            :rules="[passwordRules]"
            data-test="password-input"
        >
            <template v-slot:prepend>
                <q-icon name="lock" />
            </template>
            <template v-slot:append>
                <q-icon
                    :name="isPwd ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="isPwd = !isPwd"
                />
            </template>
        </q-input>

        <div class="row justify-between items-center q-mt-md">
            <q-btn flat dense color="primary text-bold" label="Esqueceu a senha?" size="sm" />
            <q-btn
                unelevated
                label="Entrar"
                type="submit"
                color="primary"
                class="btn-access"
                :loading="props.isLoading"
                data-test="submit-btn"
            />
        </div>
    </q-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { useValidations } from "@/composables/useValidations";

interface LoginFormPayload {
    email: string;
    password: string;
}

const props = defineProps<{
    isLoading?: boolean;
}>();

const emit = defineEmits<{
    (e: "submit", payload: LoginFormPayload): void;
}>();

const { required, emailFormat, passwordRules } = useValidations();

const isPwd = ref(true);

const form = reactive<LoginFormPayload>({
    email: "",
    password: "",
});

const onSubmit = () => {
    emit("submit", { ...form });
};
</script>

<style scoped>
.btn-access {
    padding: 8px 24px;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 1px;
}
</style>
