<template>
    <div class="login-page row">
        <div class="login-branding col-12 col-md-5 flex flex-center">
            <div class="branding-content text-center">
                <AppLogo />
                <p class="text-h5 q-mt-xl branding-subtitle">
                    Gestão completa para a sua clínica veterinária.
                </p>
                <p class="text-subtitle2 branding-text-sub">
                    Agendamentos, pagamentos e prontuários em um só lugar.
                </p>
            </div>
        </div>

        <div class="login-form-section col-12 col-md-7 flex flex-center">
            <div class="form-wrapper">
                <div class="mobile-logo-header">
                    <AppLogo />
                </div>

                <div class="text-h5 text-weight-bold text-primary q-mb-xl">Acesse sua conta</div>

                <LoginForm @submit="handleLogin" :isLoading="isLoading" />
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import AppLogo from "@/components/AppLogo.vue";
import LoginForm from "@/components/auth/LoginForm.vue";
import { useAuthStore } from "@/stores/auth";
import { useQuasar } from "quasar";
import type { LoginPayload } from "@/domain/models/Auth";
import type { FetchError } from "@/infrastructure/http/errorHandler";

const $q = useQuasar();
const authStore = useAuthStore();
const isLoading = ref(false);

const handleLogin = async (payload: LoginPayload) => {
    isLoading.value = true;
    try {
        await authStore.login(payload);

        $q.notify({ type: "positive", message: "Login realizado com sucesso!" });
    } catch (error: unknown) {
        const fetchError = error as FetchError;
        $q.notify({
            type: "negative",
            message: fetchError.data?.errorMessage || fetchError.message || "Erro ao fazer login.",
        });
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.login-page {
    min-height: 100vh;
    background-color: var(--pet-surface);
}

.login-branding {
    display: none;
    position: relative;
    background: linear-gradient(160deg, var(--pet-bg-dark-2) 0%, var(--pet-bg-dark) 100%);
    overflow: hidden;
}

.branding-content {
    padding: 40px;
    z-index: 2;
}

.branding-subtitle {
    color: var(--pet-text-white);
    font-weight: 600;
}

.branding-text-sub {
    color: var(--pet-text-light);
}

.mobile-logo-header {
    display: flex;
    justify-content: center;
    margin-bottom: 40px;
}

.form-wrapper {
    width: 100%;
    max-width: 380px;
    padding: 40px 20px;
}

.login-form-section {
    background-color: var(--pet-surface);
}

:deep(.text-primary) {
    color: var(--pet-primary) !important;
}

@media (min-width: 1024px) {
    .login-branding {
        display: flex;
    }

    .mobile-logo-header {
        display: none;
    }

    .form-wrapper {
        max-width: 460px;
        padding: 40px;
    }
}
</style>
