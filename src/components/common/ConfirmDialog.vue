<template>
    <q-dialog v-model="model">
        <q-card style="min-width: 350px">
            <q-card-section class="text-h6">{{ title }}</q-card-section>
            <q-card-section class="text-body2">
                {{ message }}
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat label="Cancelar" color="grey-7" :disable="loading" v-close-popup />
                <q-btn
                    unelevated
                    :label="confirmLabel"
                    :color="confirmColor"
                    :loading="loading"
                    @click="$emit('confirm')"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
const model = defineModel<boolean>({ required: true });

withDefaults(
    defineProps<{
        title: string;
        message: string;
        confirmLabel?: string;
        confirmColor?: string;
        loading?: boolean;
    }>(),
    {
        confirmLabel: "Confirmar",
        confirmColor: "primary",
        loading: false,
    },
);

defineEmits<{ (e: "confirm"): void }>();
</script>
