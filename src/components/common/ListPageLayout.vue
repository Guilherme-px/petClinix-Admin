<template>
    <q-page padding>
        <div class="page-container">
            <div class="page-header">
                <h1 class="page-title">{{ title }}</h1>
                <slot name="actions" />
            </div>
            <slot />
        </div>
    </q-page>
</template>

<script lang="ts" setup>
defineProps<{ title: string }>();
</script>

<style scoped>
.page-container {
    margin: 0 auto;
}

.page-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
}

.page-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

@media (max-width: 599px) {
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }

    .page-header :slotted(.page-action) {
        width: 100%;
    }
}
</style>
