<template>
    <q-dialog v-model="model">
        <q-card class="detail-dialog">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Detalhes do agendamento</div>
                <q-space />
                <q-btn flat round dense icon="close" v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-md">
                <div class="detail-list">
                    <div class="detail-row">
                        <span class="detail-label">Profissional:</span> {{ veterinarianName }}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Cliente:</span> {{ tutorName }}
                    </div>
                    <div class="detail-row" v-if="tutorPhone">
                        <span class="detail-label">Telefone:</span> {{ formattedPhone }}
                        <q-btn
                            v-if="whatsappUrl"
                            :href="whatsappUrl"
                            target="_blank"
                            flat
                            round
                            dense
                            icon="fab fa-whatsapp"
                            color="green"
                            class="q-ml-xs"
                            aria-label="Abrir conversa no WhatsApp"
                        />
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Data:</span> {{ formattedDate }}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span
                            class="status-dot"
                            :style="{ backgroundColor: statusHex[appointment.status] ?? '#9E9E9E' }"
                        />
                        {{ statusLabels[appointment.status] ?? appointment.status }}
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Serviço:</span> {{ serviceName }}
                    </div>
                    <div class="detail-row" v-if="servicePrice !== null">
                        <span class="detail-label">Valor:</span> {{ formattedPrice }}
                    </div>
                </div>
            </q-card-section>

            <q-card-actions align="between" class="q-px-md q-pb-md">
                <q-btn flat label="Fechar" color="grey-7" v-close-popup />
                <div class="q-gutter-x-md">
                    <q-btn
                        outline
                        no-wrap
                        label="Cancelar Agendamento"
                        color="amber-8"
                        icon="event_busy"
                        :disable="isLoading || !canChangeStatus"
                        @click="$emit('cancel')"
                    />
                    <q-btn
                        outline
                        no-wrap
                        label="Editar"
                        color="primary"
                        icon="edit_calendar"
                        :disable="isLoading || !canChangeStatus"
                        @click="$emit('edit')"
                    />
                </div>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { Appointment } from "@/domain/models/Appointment";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    appointment: Appointment;
    isLoading: boolean;
    veterinarians: { id: string; name: string }[];
    tutors: { id: string; name: string; phone: string | null }[];
    services: { id: string; name: string; price: number; durationInMinutes: number }[];
}>();

defineEmits<{
    (e: "edit"): void;
    (e: "cancel"): void;
}>();

const statusLabels: Record<string, string> = {
    Scheduled: "Agendado",
    Confirmed: "Confirmado",
    Completed: "Concluído",
    Canceled: "Cancelado",
    NoShow: "Falta",
};

const statusHex: Record<string, string> = {
    Scheduled: "#2196F3",
    Confirmed: "#009688",
    Completed: "#4CAF50",
    Canceled: "#F44336",
    NoShow: "#BF360C",
};

const veterinarian = computed(() =>
    props.veterinarians.find((v) => v.id === props.appointment.veterinarianId),
);

const tutor = computed(() => props.tutors.find((t) => t.id === props.appointment.tutorId));

const service = computed(() => props.services.find((s) => s.id === props.appointment.serviceId));

const veterinarianName = computed(() => veterinarian.value?.name ?? "—");
const tutorName = computed(() => tutor.value?.name ?? "—");
const serviceName = computed(() => service.value?.name ?? "—");
const tutorPhone = computed(() => tutor.value?.phone ?? null);

const canChangeStatus = computed(
    () => props.appointment.status === "Scheduled" || props.appointment.status === "Confirmed",
);

const servicePrice = computed(() => service.value?.price ?? null);

const formattedPrice = computed(() =>
    servicePrice.value === null
        ? ""
        : servicePrice.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
);

const formattedPhone = computed(() => {
    const digits = (tutorPhone.value ?? "").replace(/\D/g, "");
    if (digits.length === 11)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    if (digits.length === 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return tutorPhone.value ?? "";
});

const isMobileDevice = () => {
    const ua = navigator.userAgent;
    const isTouchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return /Android|iPhone|iPad|iPod/i.test(ua) || isTouchMac;
};

const whatsappUrl = computed(() => {
    const digits = (tutorPhone.value ?? "").replace(/\D/g, "");
    if (!digits) return "#";

    return isMobileDevice()
        ? `https://wa.me/55${digits}`
        : `https://web.whatsapp.com/send?phone=55${digits}`;
});

const addMinutes = (time: string, minutes: number) => {
    const [h = 0, m = 0] = time.split(":").map(Number);
    const total = h * 60 + m + minutes;
    const pad = (n: number) => String(n % 24).padStart(2, "0");
    return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

const formattedDate = computed(() => {
    const [year = 0, month = 1, day = 1] = props.appointment.scheduledDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    let label = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(date);
    label = label.charAt(0).toUpperCase() + label.slice(1);

    const start = props.appointment.scheduledTime;
    const end = service.value ? addMinutes(start, service.value.durationInMinutes) : null;

    return end ? `${label} | ${start} às ${end}` : `${label} | ${start}`;
});
</script>

<style scoped>
.detail-dialog {
    width: 100%;
    max-width: 680px;
}

.detail-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 4px;
}

.detail-label {
    font-weight: 600;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    margin: 0 4px;
}
</style>
