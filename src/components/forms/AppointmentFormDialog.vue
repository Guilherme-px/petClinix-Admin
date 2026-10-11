<template>
    <q-dialog v-model="model" persistent>
        <q-card class="appointment-form-card">
            <q-card-section class="text-h6">
                {{ isEdit ? "Editar Agendamento" : "Novo Agendamento" }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-list>
                    <q-expansion-item
                        icon="person"
                        label="Cliente"
                        default-opened
                        class="expansion-section"
                    >
                        <q-card-section class="row q-col-gutter-md">
                            <q-select
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.tutorId"
                                :options="tutorOptions"
                                label="Tutor"
                                emit-value
                                map-options
                                lazy-rules
                                :rules="[required]"
                                @update:model-value="onTutorChange"
                            />
                            <q-select
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.petId"
                                :options="petOptions"
                                label="Pet"
                                emit-value
                                map-options
                                lazy-rules
                                :rules="[required]"
                                :loading="petsLoading"
                                :disable="!form.tutorId || petsLoading"
                                :hint="
                                    form.tutorId && !petsLoading && petOptions.length === 0
                                        ? 'Nenhum pet cadastrado para este tutor'
                                        : ''
                                "
                            />
                        </q-card-section>
                    </q-expansion-item>

                    <q-separator />

                    <q-expansion-item
                        icon="medical_services"
                        label="Atendimento"
                        default-opened
                        class="expansion-section"
                    >
                        <q-card-section class="row q-col-gutter-md">
                            <q-select
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.veterinarianId"
                                :options="veterinarianOptions"
                                label="Veterinário"
                                emit-value
                                map-options
                                lazy-rules
                                :rules="[required]"
                                @update:model-value="onScheduleFieldChange"
                            />
                            <q-select
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.serviceId"
                                :options="serviceOptions"
                                label="Serviço"
                                emit-value
                                map-options
                                lazy-rules
                                :rules="[required]"
                                @update:model-value="onScheduleFieldChange"
                            />
                            <q-input
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.date"
                                label="Data"
                                type="date"
                                :min="minDate"
                                stack-label
                                lazy-rules
                                :rules="[required]"
                                @update:model-value="onScheduleFieldChange"
                            />
                            <q-select
                                outlined
                                class="col-xs-12 col-sm-6"
                                v-model="form.time"
                                :options="slotOptions"
                                label="Horário"
                                emit-value
                                map-options
                                lazy-rules
                                :rules="[required]"
                                :loading="slotsLoading"
                                :disable="slotsLoading || !canLoadSlots"
                                :hint="
                                    canLoadSlots && !slotsLoading && slotOptions.length === 0
                                        ? 'Nenhum horário livre nesta data'
                                        : ''
                                "
                            />
                            <q-input
                                outlined
                                class="col-12"
                                v-model="form.notes"
                                label="Observações"
                                type="textarea"
                                autogrow
                            />
                        </q-card-section>
                    </q-expansion-item>
                </q-list>

                <q-card-actions align="between" class="q-px-md q-pb-md">
                    <q-btn
                        flat
                        label="Cancelar"
                        color="grey-7"
                        :disable="isLoading"
                        v-close-popup
                    />
                    <q-btn
                        unelevated
                        :label="isEdit ? 'Atualizar' : 'Salvar'"
                        color="primary"
                        type="submit"
                        :loading="isLoading"
                    />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "@/domain/models/Appointment";
import { container } from "@/infrastructure/container";
import type { PetService } from "@/application/services/petService";
import type { AppointmentService } from "@/application/services/appointmentService";
import { useValidations } from "@/composables/useValidations";
import { createSlotController, type ScheduleSelection } from "@/composables/useAppointmentSlots";
import { createPetOptionsController } from "@/composables/usePetOptions";

const model = defineModel<boolean>({ required: true });

const props = defineProps<{
    appointment: Appointment | null;
    isLoading: boolean;
    veterinarians: { id: string; name: string }[];
    tutors: { id: string; name: string; phone: string | null }[];
    services: { id: string; name: string; price: number; durationInMinutes: number }[];
}>();

const emit = defineEmits<{
    (e: "submit", payload: RegisterAppointmentPayload | UpdateAppointmentPayload): void;
}>();

const { required } = useValidations();

const petService = container.resolve<PetService>("PetService");
const appointmentService = container.resolve<AppointmentService>("AppointmentService");

const isEdit = computed(() => !!props.appointment);

const tutorOptions = computed(() => props.tutors.map((t) => ({ label: t.name, value: t.id })));
const veterinarianOptions = computed(() =>
    props.veterinarians.map((v) => ({ label: v.name, value: v.id })),
);
const serviceOptions = computed(() => props.services.map((s) => ({ label: s.name, value: s.id })));

const emptyForm = (): RegisterAppointmentPayload => ({
    tutorId: "",
    petId: "",
    serviceId: "",
    veterinarianId: "",
    date: "",
    time: "",
    notes: null,
});

const form = ref<RegisterAppointmentPayload>(emptyForm());

const minDate = computed(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
});

const scheduleSelection = computed<ScheduleSelection>(() => ({
    veterinarianId: form.value.veterinarianId,
    serviceId: form.value.serviceId,
    date: form.value.date,
}));

const {
    options: petOptions,
    loading: petsLoading,
    load: loadPets,
} = createPetOptionsController(petService);

const {
    options: slotOptions,
    loading: slotsLoading,
    canLoad: canLoadSlots,
    load: loadSlots,
} = createSlotController(appointmentService, scheduleSelection, () => props.appointment);

const onTutorChange = async (tutorId: string) => {
    form.value.petId = "";
    await loadPets(tutorId);
};

const onScheduleFieldChange = async () => {
    form.value.time = "";
    await loadSlots();
};

watch(
    [model, () => props.appointment],
    async ([open, appointment]) => {
        if (!open) return;
        form.value = appointment
            ? {
                  tutorId: appointment.tutorId,
                  petId: appointment.petId,
                  serviceId: appointment.serviceId,
                  veterinarianId: appointment.veterinarianId,
                  date: appointment.scheduledDate,
                  time: appointment.scheduledTime,
                  notes: appointment.notes,
              }
            : emptyForm();
        if (appointment) await loadPets(appointment.tutorId);
        else petOptions.value = [];
        await loadSlots();
    },
    { immediate: true },
);

const onSubmit = () => {
    const notes = form.value.notes?.trim() || null;

    if (!props.appointment) {
        const payload: RegisterAppointmentPayload = {
            tutorId: form.value.tutorId,
            petId: form.value.petId,
            serviceId: form.value.serviceId,
            veterinarianId: form.value.veterinarianId,
            date: form.value.date,
            time: form.value.time,
            notes,
        };
        emit("submit", payload);
        return;
    }

    const payload: UpdateAppointmentPayload = {
        veterinarianId: form.value.veterinarianId,
        serviceId: form.value.serviceId,
        date: form.value.date,
        time: form.value.time,
        notes,
    };
    emit("submit", payload);
};
</script>

<style scoped>
.appointment-form-card {
    width: 100%;
    max-width: 560px;
}
</style>
