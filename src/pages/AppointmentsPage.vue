<template>
    <q-page padding>
        <ListPageLayout title="Agenda">
            <template #actions>
                <q-btn
                    unelevated
                    no-wrap
                    label="Novo Agendamento"
                    color="primary"
                    icon="add"
                    @click="openCreate"
                />
            </template>

            <div class="calendar-shell">
                <div class="relative-position">
                    <FullCalendar ref="calendarRef" :options="calendarOptions" />

                    <div
                        v-if="isCalendarLoading"
                        class="absolute-full flex flex-center calendar-loading"
                    >
                        <q-spinner-clock color="primary" size="50px" />
                    </div>
                </div>

                <AppointmentStatusLegend />
            </div>

            <AppointmentDetailDialog
                v-if="selectedAppointment"
                v-model="isDetailOpen"
                :appointment="selectedAppointment"
                :is-loading="isStatusUpdating"
                :veterinarians="veterinarians"
                :tutors="tutors"
                :services="services"
                @edit="openEditFromDetail"
                @cancel="onCancelAppointment"
            />

            <AppointmentFormDialog
                v-model="isFormOpen"
                :appointment="selectedAppointment"
                :is-loading="isSubmitting"
                :veterinarians="veterinarians"
                :tutors="tutors"
                :services="services"
                @submit="onFormSubmit"
            />
        </ListPageLayout>
    </q-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import FullCalendar, { type CalendarOptions } from "@fullcalendar/vue3";
import themePlugin from "@fullcalendar/vue3/themes/monarch";
import dayGridPlugin from "@fullcalendar/vue3/daygrid";
import interactionPlugin from "@fullcalendar/vue3/interaction";
import timeGridPlugin from "@fullcalendar/vue3/timegrid";
import ptBrLocale from "@fullcalendar/vue3/locales/pt-br";
import "@fullcalendar/vue3/skeleton.css";
import "@fullcalendar/vue3/themes/monarch/theme.css";
import "@/assets/css/monarch-palette.css";
import ListPageLayout from "@/components/common/ListPageLayout.vue";
import AppointmentDetailDialog from "@/components/appointments/AppointmentDetailDialog.vue";
import AppointmentFormDialog from "@/components/forms/AppointmentFormDialog.vue";
import { container } from "@/infrastructure/container";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";
import type { AppointmentService } from "@/application/services/appointmentService";
import type { StaffService } from "@/application/services/staffService";
import type { TutorService } from "@/application/services/tutorService";
import type { CatalogService } from "@/application/services/catalogService";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/domain/models/Appointment";
import { createAppointmentsCalendar } from "@/composables/useAppointmentsCalendar";
import { createAppointmentLookups } from "@/composables/useAppointmentLookups";
import AppointmentStatusLegend from "@/components/appointments/AppointmentStatusLegend.vue";

const $q = useQuasar();

const notifyError = (message: string) => $q.notify({ type: "negative", message });

const appointmentService = container.resolve<AppointmentService>("AppointmentService");

const {
    veterinarians,
    tutors,
    services,
    load: loadLookups,
} = createAppointmentLookups(
    {
        staffService: container.resolve<StaffService>("StaffService"),
        tutorService: container.resolve<TutorService>("TutorService"),
        catalogService: container.resolve<CatalogService>("CatalogService"),
    },
    () => notifyError("Erro ao carregar dados para agendamento."),
);

const {
    events: calendarEvents,
    isLoading: isCalendarLoading,
    loadRange,
    rebuildEvents,
    findById,
} = createAppointmentsCalendar(
    container.resolve<AppointmentService>("AppointmentService"),
    (error) => notifyError(getErrorMessage(error, "Erro ao carregar agendamentos.")),
    () => veterinarians.value,
);

const isDetailOpen = ref(false);
const isFormOpen = ref(false);
const isSubmitting = ref(false);
const isStatusUpdating = ref(false);
const selectedAppointment = ref<Appointment | null>(null);
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, themePlugin],
    initialView: "dayGridMonth",
    locale: ptBrLocale,
    headerToolbar: {
        left: "dayGridMonth,timeGridWeek,timeGridDay",
        center: "title",
        right: "prev,today,next",
    },
    buttonText: {
        today: "Hoje",
        month: "Mês",
        week: "Semana",
        day: "Dia",
    },
    weekends: true,
    selectable: true,
    eventDisplay: "block",
    events: calendarEvents.value,
    datesSet: onDatesSet,
    eventClick: onEventClick,
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "18:00:00",
    height: 750,
    fixedWeekCount: true,
    showNonCurrentDates: true,
    eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    },
    loading: (isLoading: boolean) => {
        isCalendarLoading.value = isLoading;
    },
}));

const onDatesSet = (dateInfo: { start: Date; end: Date }) => {
    void loadRange(dateInfo.start, dateInfo.end);
};

const onEventClick = (info: { event: { id: string } }) => {
    selectedAppointment.value = findById(info.event.id);
    if (selectedAppointment.value) {
        isDetailOpen.value = true;
    }
};

const openCreate = () => {
    selectedAppointment.value = null;
    void loadLookups();
    isFormOpen.value = true;
};

const openEditFromDetail = () => {
    isDetailOpen.value = false;
    void loadLookups();
    isFormOpen.value = true;
};

const refreshCalendar = () => {
    const api = calendarRef.value?.getApi();
    if (api) void loadRange(api.view.activeStart, api.view.activeEnd);
};

const onCancelAppointment = async () => {
    if (!selectedAppointment.value) return;

    isStatusUpdating.value = true;
    try {
        await appointmentService.updateStatus(selectedAppointment.value.id, "Canceled");
        isDetailOpen.value = false;
        $q.notify({ type: "positive", message: "Agendamento cancelado!" });
        refreshCalendar();
    } catch (error) {
        notifyError(getErrorMessage(error, "Erro ao cancelar agendamento."));
    } finally {
        isStatusUpdating.value = false;
    }
};

const onFormSubmit = async (payload: RegisterAppointmentPayload | UpdateAppointmentPayload) => {
    isSubmitting.value = true;
    try {
        if (selectedAppointment.value) {
            await appointmentService.update(
                selectedAppointment.value.id,
                payload as UpdateAppointmentPayload,
            );
        } else {
            await appointmentService.register(payload as RegisterAppointmentPayload);
        }

        isFormOpen.value = false;
        selectedAppointment.value = null;
        $q.notify({
            type: "positive",
            message: "Agendamento salvo com sucesso!",
        });
        refreshCalendar();
    } catch (error) {
        notifyError(getErrorMessage(error, "Erro ao salvar agendamento."));
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(async () => {
    await loadLookups();
    rebuildEvents();
});
</script>

<style scoped>
.calendar-shell {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background-color: #ffffff;
}

.calendar-shell :deep([class^="fc-monarch-lqx"]),
.calendar-shell :deep([class*=" fc-monarch-MAH"]) {
    border-radius: 0 !important;
}
</style>
