<template>
    <div
        v-if="authStore.isAuthenticating || isOpeningBilling"
        class="loading-screen column flex-center bg-white"
    >
        <q-spinner-dots color="primary" size="50px" />
        <p class="text-grey-7 q-mt-md">
            {{
                authStore.isAuthenticating
                    ? "Validando sessão..."
                    : "Abrindo portal de assinatura..."
            }}
        </p>
    </div>

    <q-layout v-else view="hHh LpR fFf">
        <q-header elevated class="bg-white text-dark">
            <q-toolbar>
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

                <q-space />

                <q-btn-dropdown flat no-caps :label="displayName">
                    <q-list>
                        <q-item clickable v-close-popup @click="router.push('/profile')">
                            <q-item-section avatar>
                                <q-icon name="person" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>Meu Perfil</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item
                            v-if="authStore.userRole === 'Admin'"
                            clickable
                            v-close-popup
                            :disable="isOpeningBilling"
                            @click="openBillingPortal"
                        >
                            <q-item-section avatar>
                                <q-icon name="credit_card" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>Minha Assinatura</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-separator />

                        <q-item clickable v-close-popup @click="handleLogout" class="text-negative">
                            <q-item-section avatar>
                                <q-icon name="logout" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>Sair</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </q-toolbar>
        </q-header>

        <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-2">
            <div class="column fit">
                <q-scroll-area class="col">
                    <q-list>
                        <q-item
                            v-for="item in menuItems"
                            :key="item.label"
                            clickable
                            v-ripple
                            :to="item.route"
                            active-class="text-primary"
                        >
                            <q-item-section avatar>
                                <q-icon :name="item.icon" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ item.label }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-scroll-area>

                <q-separator />

                <div class="q-pa-md flex flex-center">
                    <AppLogo />
                </div>
            </div>
        </q-drawer>

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import AppLogo from "@/components/AppLogo.vue";
import { useAuthStore } from "@/stores/auth";
import type { BillingService } from "@/application/services/billingService";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import { useQuasar } from "quasar";

const leftDrawerOpen = ref(false);
const isOpeningBilling = ref(false);

const $q = useQuasar();
const authStore = useAuthStore();
const router = useRouter();

const billingService = container.resolve<BillingService>("BillingService");

const menuItems = [
    { label: "Agendamentos", icon: "event", route: "/appointments" },
    { label: "Clientes", icon: "group", route: "/tutors" },
    { label: "Pets", icon: "pets", route: "/pets" },
    { label: "Serviços", icon: "medical_services", route: "/services" },
    { label: "Equipe", icon: "badge", route: "/staff" },
    { label: "Meu perfil", icon: "person", route: "/profile" },
];

const displayName = computed(() => {
    const fullName = authStore.user?.name;
    if (!fullName) return "Minha Conta";

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0]!;
    const secondName = parts[1] ?? "";

    if (parts.length === 1) return firstName;

    if (firstName.length <= 4 && secondName) {
        return `${firstName} ${secondName}`;
    }

    return firstName;
});

const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value;
};

const handleLogout = () => {
    authStore.logout();
    router.push("/login");
};

const openBillingPortal = async () => {
    if (isOpeningBilling.value) return;

    isOpeningBilling.value = true;
    try {
        const { portalUrl } = await billingService.createPortalSession(window.location.href);
        window.location.href = portalUrl;
    } catch (error) {
        $q.notify({
            type: "negative",
            message: getErrorMessage(error, "Erro ao abrir o portal de assinatura."),
        });
    } finally {
        isOpeningBilling.value = false;
    }
};
</script>

<style scoped>
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
}

.q-toolbar__title {
    flex-grow: 0;
    margin-right: 20px;
}
</style>
