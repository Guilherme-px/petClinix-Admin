<template>
    <div class="empty-state column flex-center q-py-xl q-px-md text-center">
        <div class="empty-state__image-wrap">
            <img :src="image" :alt="title" class="empty-state__image" />
        </div>
        <div class="text-subtitle1 text-weight-medium text-grey-8 q-mt-xl">{{ title }}</div>
        <div v-if="description" class="text-body2 text-grey-6 q-mt-xs empty-state__description">
            {{ description }}
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    image: string;
    title: string;
    description?: string;
}>();
</script>

<style scoped>
.empty-state {
    width: 100%;
    min-height: 420px;
    justify-content: center;
}

.empty-state__image-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-state__image {
    width: 320px;
    max-width: 60vw;
    height: auto;
    position: relative;
}

.empty-state__description {
    max-width: 360px;
    line-height: 1.5;
}
</style>
