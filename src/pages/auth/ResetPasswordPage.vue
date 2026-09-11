<template>
    <div class="reset-password-page flex flex-center q-pa-md">
        <q-card class="q-pa-lg shadow-2" style="width: 100%; max-width: 400px">
            <q-card-section class="text-center">
                <AppLogo />
                <div class="text-h6 text-weight-bold q-mt-md text-primary">Definir Nova Senha</div>
                <div class="text-subtitle2 text-grey-7">
                    Digite o token recebido e sua nova senha.
                </div>
            </q-card-section>

            <q-form @submit="onSubmit" class="q-gutter-md">
                <q-input
                    outlined
                    v-model="token"
                    label="Token de Recuperação"
                    lazy-rules
                    :rules="[required]"
                    data-test="token-input"
                >
                    <template v-slot:prepend>
                        <q-icon name="vpn_key" />
                    </template>
                </q-input>

                <q-input
                    outlined
                    v-model="password"
                    label="Nova Senha"
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

                <q-input
                    outlined
                    v-model="confirmPassword"
                    label="Confirmar Senha"
                    :type="isPwd ? 'password' : 'text'"
                    lazy-rules
                    :rules="[confirmPasswordRules(password)]"
                    data-test="confirm-password-input"
                >
                    <template v-slot:prepend>
                        <q-icon name="lock" />
                    </template>
                </q-input>

                <div class="row justify-between items-center q-mt-md">
                    <q-btn
                        flat
                        dense
                        color="primary text-bold"
                        label="Voltar para login"
                        size="sm"
                        @click="router.push('/login')"
                    />
                    <q-btn
                        unelevated
                        label="Salvar Senha"
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
const { required, passwordRules, confirmPasswordRules } = useValidations();

const isLoading = ref(false);
const isPwd = ref(true);
const token = ref("");
const password = ref("");
const confirmPassword = ref("");

const onSubmit = async () => {
    isLoading.value = true;
    try {
        await authStore.setPassword(token.value, password.value);
        $q.notify({
            type: "positive",
            message: "Senha redefinida com sucesso!",
            timeout: 3000,
        });
        router.push("/login");
    } catch {
        $q.notify({
            type: "negative",
            message: "Erro ao redefinir senha. Verifique o token.",
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.reset-password-page {
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
