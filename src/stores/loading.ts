import { defineStore } from "pinia";
import { computed, ref } from "vue";

const SHOW_DELAY_MS = 800;

export const useLoadingStore = defineStore("loading", () => {
    const pendingCount = ref(0);
    const isVisible = ref(false);
    const startedAt = ref<number | null>(null);

    let showTimer: ReturnType<typeof setTimeout> | null = null;

    const hasPendingRequests = computed(() => pendingCount.value > 0);

    function begin(): void {
        pendingCount.value += 1;
        if (pendingCount.value === 1) {
            startedAt.value = Date.now();
            showTimer = setTimeout(() => {
                if (pendingCount.value > 0) {
                    isVisible.value = true;
                }
            }, SHOW_DELAY_MS);
        }
    }

    function end(): void {
        if (pendingCount.value === 0) {
            return;
        }
        pendingCount.value -= 1;
        if (pendingCount.value === 0) {
            if (showTimer) {
                clearTimeout(showTimer);
                showTimer = null;
            }
            isVisible.value = false;
            startedAt.value = null;
        }
    }

    return {
        pendingCount,
        isVisible,
        startedAt,
        hasPendingRequests,
        begin,
        end,
    };
});

export type LoadingStore = ReturnType<typeof useLoadingStore>;

export const resolveLoadingStore = (): LoadingStore | null => {
    try {
        return useLoadingStore();
    } catch {
        return null;
    }
};
