<template>
    <div class="forgot-password-page flex flex-center q-pa-md">
        <q-card class="q-pa-lg shadow-2" style="width: 100%; max-width: 400px;">
            <q-card-section class="text-center">
                <AppLogo />
                <div class="text-h6 text-weight-bold q-mt-md text-primary">Recuperar Senha</div>
                <div class="text-subtitle2 text-grey-7">Digite seu e-mail para receber o link de recuperação.</div>
            </q-card-section>

            <q-form @submit="onSubmit" class="q-gutter-md">
                <q-input
                    outlined
                    v-model="email"
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

                <div class="row justify-between items-center q-mt-md">
                    <q-btn flat dense color="primary text-bold" label="Voltar para login" size="sm" @click="router.push('/login')" />
                    <q-btn
                        unelevated
                        label="Enviar Link"
                        type="submit"
                        color="primary"
                        class="btn-access"
                        :loading="isLoading"
                        data-test="submit-btn"
                    />
                </div>
            </q-form>
        </q-card>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AppLogo from "@/components/AppLogo.vue";
import { useAuthStore } from "@/stores/auth";
import { useQuasar } from "quasar";
import { useValidations } from "@/composables/useValidations";

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();
const { required, emailFormat } = useValidations();

const isLoading = ref(false);
const email = ref("");

const onSubmit = async () => {
    isLoading.value = true;
    try {
        await authStore.requestPasswordReset(email.value);
        $q.notify({
            type: "positive",
            message: "Um link de recuperação foi enviado para o e-mail",
            timeout: 5000
        });
        router.push("/login");
    } catch {
        $q.notify({
            type: "negative",
            message: "Erro ao tentar recuperar a senha. Tente novamente."
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.forgot-password-page {
    min-height: 100vh;
    background-color: #f5f7f9;
}

.btn-access {
    padding: 8px 24px;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 1px;
}
</style>
