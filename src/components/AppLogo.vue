<template>
    <div class="app-logo flex flex-center">
        <img :src="currentLogo" :alt="'PetClinix Logo'" class="logo-img" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

import logoDesktop from '@/assets/logo.png'
import logoMobile from '@/assets/logo-mobile.png'

const $q = useQuasar()

const currentLogo = computed(() => {
    return $q.screen.xs ? logoMobile : logoDesktop
})
</script>

<style scoped>
.logo-img {
    width: 100%;
    max-width: 220px;
    height: auto;
    object-fit: contain;
}

@media (max-width: 599px) {
    .logo-img {
        max-width: 80px;
    }
}
</style>
