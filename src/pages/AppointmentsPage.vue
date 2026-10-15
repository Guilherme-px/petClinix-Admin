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
                <div class="calendar-header">
                    <div class="calendar-header__views">
                        <q-btn-toggle
                            v-model="currentView"
                            unelevated
                            no-caps
                            dense
                            class="view-toggle"
                            toggle-color="primary"
                            :options="viewOptions"
                            @update:model-value="changeView"
                        />
                    </div>

                    <div class="calendar-header__title">{{ viewTitle }}</div>

                    <div class="calendar-header__nav">
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_left"
                            class="nav-btn"
                            @click="goPrev"
                        />
                        <q-btn flat dense no-caps label="Hoje" class="today-btn" @click="goToday" />
                        <q-btn
                            flat
                            round
                            dense
                            icon="chevron_right"
                            class="nav-btn"
                            @click="goNext"
                        />
                    </div>
                </div>

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
import { ref, computed, watch, onMounted } from "vue";
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

const isMobile = computed(() => $q.screen.lt.sm);

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

const currentView = ref(isMobile.value ? "timeGridWeek" : "dayGridMonth");
const viewTitle = ref("");

const viewOptions = computed(() =>
    isMobile.value
        ? [
              { label: "Semana", value: "timeGridWeek" },
              { label: "Dia", value: "timeGridDay" },
          ]
        : [
              { label: "Mês", value: "dayGridMonth" },
              { label: "Semana", value: "timeGridWeek" },
              { label: "Dia", value: "timeGridDay" },
          ],
);

const getApi = () => calendarRef.value?.getApi();

const goPrev = () => getApi()?.prev();
const goNext = () => getApi()?.next();
const goToday = () => getApi()?.today();
const changeView = (view: string | number | null) => {
    if (typeof view === "string") getApi()?.changeView(view);
};

const renderEventContent = (arg: { timeText: string; event: { title: string } }) => {
    const wrapper = document.createElement("div");
    wrapper.style.cssText =
        "padding:2px 5px;overflow:hidden;line-height:1.25;text-align:left;";

    if (arg.timeText) {
        const time = document.createElement("div");
        time.style.cssText = "font-size:10px;font-weight:700;white-space:nowrap;";
        time.textContent = arg.timeText;
        wrapper.appendChild(time);
    }

    const title = document.createElement("div");
    title.style.cssText =
        "font-size:10.5px;white-space:normal;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;";
    title.textContent = arg.event.title;
    wrapper.appendChild(title);

    return { domNodes: [wrapper] };
};

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, themePlugin],
    initialView: currentView.value,
    locale: ptBrLocale,
    headerToolbar: false,
    weekends: true,
    selectable: true,
    eventDisplay: "block",
    events: calendarEvents.value,
    datesSet: onDatesSet,
    eventClick: onEventClick,
    eventContent: renderEventContent,
    allDaySlot: false,
    slotMinTime: "08:00:00",
    slotMaxTime: "18:00:00",
    slotEventOverlap: false,
    eventMinHeight: 34,
    height: isMobile.value ? "auto" : 750,
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

watch(isMobile, (mobile) => {
    changeView(mobile ? "timeGridWeek" : "dayGridMonth");
});

const onDatesSet = (dateInfo: {
    start: Date;
    end: Date;
    view: { title: string; type: string };
}) => {
    viewTitle.value = dateInfo.view.title;
    currentView.value = dateInfo.view.type;
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
    const api = getApi();
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

.calendar-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #eeeeee;
    background-color: #ffffff;
}

.calendar-header__views {
    justify-self: start;
}

.calendar-header__nav {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 2px;
}

.calendar-header__title {
    font-size: 1.4rem;
    font-weight: 700;
    color: #16213e;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.view-toggle {
    background-color: #eef1f4;
    border-radius: 999px;
    padding: 3px;
}

.view-toggle :deep(.q-btn) {
    border-radius: 999px;
    padding: 5px 16px;
    min-height: 0;
    font-weight: 500;
    color: #4b5563;
}

.today-btn {
    border: 1px solid #d5d9e0;
    border-radius: 999px;
    padding: 5px 18px;
    min-height: 0;
    font-weight: 500;
    color: #4b5563;
}

.nav-btn {
    color: #4b5563;
}

@media (max-width: 599px) {
    .calendar-header {
        grid-template-columns: 1fr;
        justify-items: center;
        gap: 10px;
        padding: 12px;
    }

    .calendar-header__title {
        order: -1;
        max-width: 100%;
        font-size: 1.2rem;
        white-space: normal;
    }

    .calendar-header__views,
    .calendar-header__nav {
        justify-self: center;
    }

    .view-toggle :deep(.q-btn) {
        padding: 4px 14px;
    }
}
</style>
