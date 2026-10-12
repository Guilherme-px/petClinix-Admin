import { ref } from "vue";
import type { AppointmentService } from "@/application/services/appointmentService";
import type { Appointment, VeterinarianLookup } from "@/domain/models/Appointment";
import { appointmentStatusLabel, appointmentStatusColor } from "@/domain/models/Appointment";

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: { status: string };
}

export const formatDateKey = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const buildCalendarEvents = (
    list: Appointment[],
    veterinarians: VeterinarianLookup[] = [],
): CalendarEvent[] => {
    const vetNameById = new Map(veterinarians.map((v) => [v.id, v.name]));

    return list.map((a) => {
        const vetName = vetNameById.get(a.veterinarianId);

        return {
            id: a.id,
            title: vetName ? `- ${vetName}` : appointmentStatusLabel(a.status),
            start: `${a.scheduledDate}T${a.scheduledTime}:00`,
            color: appointmentStatusColor(a.status),
            backgroundColor: appointmentStatusColor(a.status),
            borderColor: appointmentStatusColor(a.status),
            extendedProps: { status: a.status },
        };
    });
};

export const createAppointmentsCalendar = (
    appointmentService: AppointmentService,
    onError: (error: unknown) => void,
    getVeterinarians: () => VeterinarianLookup[] = () => [],
) => {
    const appointments = ref<Appointment[]>([]);
    const events = ref<CalendarEvent[]>([]);
    const isLoading = ref(false);

    const rebuildEvents = () => {
        events.value = buildCalendarEvents(appointments.value, getVeterinarians());
    };

    const loadRange = async (start: Date, end: Date) => {
        isLoading.value = true;
        try {
            const rangeEnd = new Date(end);
            rangeEnd.setDate(rangeEnd.getDate() - 1);

            appointments.value = await appointmentService.listByRange(
                formatDateKey(start),
                formatDateKey(rangeEnd),
            );
            rebuildEvents();
        } catch (error) {
            onError(error);
        } finally {
            isLoading.value = false;
        }
    };

    const findById = (id: string): Appointment | null =>
        appointments.value.find((a) => a.id === id) ?? null;

    return { appointments, events, isLoading, loadRange, rebuildEvents, findById };
};
