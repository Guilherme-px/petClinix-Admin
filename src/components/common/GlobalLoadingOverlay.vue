<template>
    <Teleport to="body">
        <Transition name="global-loading-fade">
            <div v-if="loadingStore.isVisible" class="global-loading-overlay">
                <q-spinner-dots color="primary" size="56px" />
                <p class="global-loading-message">{{ message }}</p>
            </div>
        </Transition>
    </Teleport>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useLoadingStore } from "@/stores/loading";

const loadingStore = useLoadingStore();

const now = ref(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;

const elapsedSeconds = computed(() => {
    if (!loadingStore.startedAt) {
        return 0;
    }
    return Math.floor((now.value - loadingStore.startedAt) / 1000);
});

const message = computed(() => {
    if (elapsedSeconds.value < 4) {
        return "Carregando...";
    }
    if (elapsedSeconds.value < 15) {
        return "Conectando ao servidor...";
    }
    return "O servidor está demorando? Se for a primeira carga do dia, ele pode ainda estar iniciando — aguarde um instante...";
});

watch(
    () => loadingStore.isVisible,
    (visible) => {
        if (visible) {
            now.value = Date.now();
            ticker = setInterval(() => {
                now.value = Date.now();
            }, 1000);
            return;
        }
        if (ticker) {
            clearInterval(ticker);
            ticker = null;
        }
    },
    { immediate: true },
);

onBeforeUnmount(() => {
    if (ticker) {
        clearInterval(ticker);
        ticker = null;
    }
});
</script>

<style scoped>
.global-loading-overlay {
    position: fixed;
    inset: 0;
    z-index: 9000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
}

.global-loading-message {
    margin: 16px 0 0;
    max-width: 460px;
    padding: 0 24px;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
}

.global-loading-fade-enter-active,
.global-loading-fade-leave-active {
    transition: opacity 0.25s ease;
}

.global-loading-fade-enter-from,
.global-loading-fade-leave-to {
    opacity: 0;
}
</style>
