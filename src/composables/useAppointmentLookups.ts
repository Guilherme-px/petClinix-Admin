import { ref } from "vue";
import type { StaffService } from "@/application/services/staffService";
import type { TutorService } from "@/application/services/tutorService";
import type { CatalogService } from "@/application/services/catalogService";
import type { VeterinarianLookup, TutorLookup, ServiceLookup } from "@/domain/models/Appointment";

export interface AppointmentLookupServices {
    staffService: StaffService;
    tutorService: TutorService;
    catalogService: CatalogService;
}

export const createAppointmentLookups = (
    services: AppointmentLookupServices,
    onError: (error: unknown) => void,
) => {
    const veterinarians = ref<VeterinarianLookup[]>([]);
    const tutors = ref<TutorLookup[]>([]);
    const serviceOptions = ref<ServiceLookup[]>([]);

    const load = async () => {
        try {
            const [staff, tutorPage, servicePage] = await Promise.all([
                services.staffService.list({ pageNumber: 1, pageSize: 100, search: "" }),
                services.tutorService.list({ pageNumber: 1, pageSize: 100, search: "" }),
                services.catalogService.list({ pageNumber: 1, pageSize: 100, search: "" }),
            ]);

            veterinarians.value = staff.items
                .filter((s) => s.role === "Veterinarian")
                .map((s) => ({ id: s.id, name: s.name }));
            tutors.value = tutorPage.items.map((t) => ({
                id: t.id,
                name: t.name,
                phone: t.phoneNumber,
            }));
            serviceOptions.value = servicePage.items.map((s) => ({
                id: s.id,
                name: s.name,
                price: s.price,
                durationInMinutes: s.durationInMinutes,
            }));
        } catch (error) {
            onError(error);
        }
    };

    return { veterinarians, tutors, services: serviceOptions, load };
};
