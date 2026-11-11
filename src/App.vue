<template>
    <GlobalLoadingOverlay />
    <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import GlobalLoadingOverlay from "@/components/common/GlobalLoadingOverlay.vue";
import router from "@/router";

const SPLASH_FADE_MS = 300;
const SPLASH_SAFETY_TIMEOUT_MS = 150000;

const removeBootSplash = () => {
    const splash = document.getElementById("app-splash");
    if (!splash) {
        return;
    }
    splash.classList.add("app-splash-hidden");
    window.setTimeout(() => splash.remove(), SPLASH_FADE_MS);
};

onMounted(() => {
    router.isReady().then(removeBootSplash).catch(removeBootSplash);
    window.setTimeout(removeBootSplash, SPLASH_SAFETY_TIMEOUT_MS);
});
</script>
