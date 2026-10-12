<template>
    <div class="status-legend">
        <div v-for="status in statuses" :key="status.value" class="status-legend__item">
            <span class="status-legend__dot" :style="{ backgroundColor: status.color }" />
            {{ status.label }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { AppointmentStatus } from "@/domain/models/Appointment";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/domain/models/Appointment";

const statuses = (Object.keys(APPOINTMENT_STATUS_LABELS) as AppointmentStatus[]).map((status) => ({
    value: status,
    label: APPOINTMENT_STATUS_LABELS[status],
    color: APPOINTMENT_STATUS_COLORS[status],
}));
</script>

<style scoped>
.status-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 20px;
    padding: 8px 12px;
    background-color: #f5f5f5;
    border-top: 1px solid #e0e0e0;
}

.status-legend__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #616161;
}

.status-legend__dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
}
</style>
