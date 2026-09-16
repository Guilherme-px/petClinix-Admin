<template>
    <q-page padding>
        <div class="row justify-center">
            <div class="col-12 col-md-10 col-lg-8">
                <q-card class="shadow-2">
                    <q-card-section>
                        <div class="text-h5 text-primary">Meu Perfil</div>
                    </q-card-section>

                    <q-card-section>
                        <template v-if="authStore.userRole === 'Admin'">
                            <q-list bordered separator>
                                <q-expansion-item group="profile" label="Meus Dados" default-opened>
                                    <q-card>
                                        <q-card-section>
                                            <UserForm
                                                :user="authStore.user"
                                                :is-loading="isLoadingUser"
                                                @submit="onSubmitUser"
                                            />
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                                <q-expansion-item group="profile" label="Dados da Clínica">
                                    <q-card>
                                        <q-card-section>
                                            <ClinicForm
                                                :clinic="authStore.user?.clinic"
                                                :is-loading="isLoadingClinic"
                                                @submit="onSubmitClinic"
                                            />
                                        </q-card-section>
                                    </q-card>
                                </q-expansion-item>
                            </q-list>
                        </template>

                        <template v-else>
                            <UserForm
                                :user="authStore.user"
                                :is-loading="isLoadingUser"
                                @submit="onSubmitUser"
                            />
                        </template>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useQuasar } from "quasar";
import type { UpdateAccountPayload } from "@/domain/models/Auth";
import UserForm from "@/components/profile/UserForm.vue";
import ClinicForm from "@/components/profile/ClinicForm.vue";

const $q = useQuasar();
const authStore = useAuthStore();

const isLoadingUser = ref(false);
const isLoadingClinic = ref(false);

const fullPayload = ref<UpdateAccountPayload>({} as UpdateAccountPayload);

watch(
    () => authStore.user,
    (user) => {
        if (!user) return;
        fullPayload.value.userName = user.name || "";
        fullPayload.value.userPhoneNumber = user.phoneNumber || "";
        fullPayload.value.userBirthDate = user.birthDate || "";

        if (user.clinic) {
            fullPayload.value.clinicTradeName = user.clinic.tradeName || "";
            fullPayload.value.clinicLegalName = user.clinic.legalName || "";
            fullPayload.value.clinicDocumentNumber = user.clinic.documentNumber || "";
            fullPayload.value.clinicEmail = user.clinic.email || "";
            fullPayload.value.clinicPhoneNumber = user.clinic.phoneNumber || "";
            fullPayload.value.clinicZipCode = user.clinic.zipCode || "";
            fullPayload.value.clinicStreet = user.clinic.street || "";
            fullPayload.value.clinicNumber = user.clinic.number || "";
            fullPayload.value.clinicNeighborhood = user.clinic.neighborhood || "";
            fullPayload.value.clinicComplement = user.clinic.complement || "";
            fullPayload.value.clinicCity = user.clinic.city || "";
            fullPayload.value.clinicState = user.clinic.state || "";
        }
    },
    { immediate: true },
);

const onSubmitUser = async (data: Partial<UpdateAccountPayload>) => {
    isLoadingUser.value = true;
    Object.assign(fullPayload.value, data);
    try {
        await authStore.updateAccount(fullPayload.value);
        $q.notify({ type: "positive", message: "Dados pessoais atualizados!" });
    } catch {
        $q.notify({ type: "negative", message: "Erro ao atualizar dados." });
    } finally {
        isLoadingUser.value = false;
    }
};

const onSubmitClinic = async (data: Partial<UpdateAccountPayload>) => {
    isLoadingClinic.value = true;
    Object.assign(fullPayload.value, data);
    try {
        await authStore.updateAccount(fullPayload.value);
        $q.notify({ type: "positive", message: "Dados da clínica atualizados!" });
    } catch {
        $q.notify({ type: "negative", message: "Erro ao atualizar clínica." });
    } finally {
        isLoadingClinic.value = false;
    }
};
</script>
