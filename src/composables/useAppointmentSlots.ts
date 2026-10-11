import { ref, computed, type Ref } from "vue";
import type { AppointmentService } from "@/application/services/appointmentService";
import type { Appointment } from "@/domain/models/Appointment";

export interface ScheduleSelection {
    veterinarianId: string;
    serviceId: string;
    date: string;
}

export const buildSlotOptions = (
    slots: string[],
    appointment: Appointment | null,
    selection: ScheduleSelection,
): { label: string; value: string }[] => {
    const scheduleUnchanged =
        appointment &&
        selection.veterinarianId === appointment.veterinarianId &&
        selection.serviceId === appointment.serviceId &&
        selection.date === appointment.scheduledDate;

    const merged =
        scheduleUnchanged && appointment.scheduledTime && !slots.includes(appointment.scheduledTime)
            ? [appointment.scheduledTime, ...slots]
            : slots;

    return [...merged].sort().map((slot) => ({ label: slot, value: slot }));
};

export const createSlotController = (
    appointmentService: AppointmentService,
    selection: Ref<ScheduleSelection>,
    getCurrentAppointment: () => Appointment | null,
) => {
    const options = ref<{ label: string; value: string }[]>([]);
    const loading = ref(false);

    const canLoad = computed(
        () => !!(selection.value.veterinarianId && selection.value.serviceId && selection.value.date),
    );

    const load = async () => {
        if (!canLoad.value) {
            options.value = [];
            return;
        }

        loading.value = true;
        try {
            const slots = await appointmentService.getAvailableSlots(
                selection.value.veterinarianId,
                selection.value.serviceId,
                selection.value.date,
            );
            options.value = buildSlotOptions(slots, getCurrentAppointment(), selection.value);
        } catch {
            options.value = [];
        } finally {
            loading.value = false;
        }
    };

    return { options, loading, canLoad, load };
};
