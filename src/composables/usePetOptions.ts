import { ref } from "vue";
import type { PetService } from "@/application/services/petService";
import type { Pet } from "@/domain/models/Pet";

export interface OptionItem {
    label: string;
    value: string;
}

export const createPetOptionsController = (petService: PetService) => {
    const options = ref<OptionItem[]>([]);
    const loading = ref(false);

    const load = async (tutorId: string) => {
        if (!tutorId) {
            options.value = [];
            return;
        }

        loading.value = true;
        try {
            const pets = await petService.list(tutorId, { pageNumber: 1, pageSize: 100, search: "" });
            options.value = pets.items.map((p: Pet) => ({ label: p.name, value: p.id }));
        } catch {
            options.value = [];
        } finally {
            loading.value = false;
        }
    };

    return { options, loading, load };
};
