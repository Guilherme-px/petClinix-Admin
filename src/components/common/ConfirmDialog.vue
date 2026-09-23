<template>
    <q-dialog v-model="model">
        <q-card class="confirm-dialog" flat>
            <div class="confirm-dialog__banner" :class="`bg-${confirmColor}`">
                <q-icon :name="icon" size="48px" color="white" />
            </div>

            <q-card-section class="q-pt-lg q-px-lg q-pb-none">
                <div class="text-h6 text-weight-bold text-center">{{ title }}</div>
            </q-card-section>

            <q-card-section class="q-px-lg q-py-sm text-center">
                <div class="text-body2 text-grey-8">{{ message }}</div>
            </q-card-section>

            <q-card-actions align="between" class="q-px-lg q-pb-lg q-pt-md">
                <q-btn flat label="Cancelar" color="grey-7" :disable="loading" v-close-popup />
                <q-btn
                    unelevated
                    :label="confirmLabel"
                    :color="confirmColor"
                    :loading="loading"
                    class="q-px-md"
                    @click="$emit('confirm')"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
const model = defineModel<boolean>({ required: true });

const props = withDefaults(
    defineProps<{
        title: string;
        message: string;
        icon?: string;
        confirmLabel?: string;
        confirmColor?: string;
        loading?: boolean;
    }>(),
    {
        icon: "help",
        confirmLabel: "Confirmar",
        confirmColor: "primary",
        loading: false,
    },
);

const emit = defineEmits<{ (e: "confirm"): void }>();

defineExpose({ props, emit });
</script>

<style scoped>
.confirm-dialog {
    min-width: 60px;
    max-width: 30vw;
    border-radius: 12px;
    overflow: hidden;
}

.confirm-dialog__banner {
    height: 88px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
