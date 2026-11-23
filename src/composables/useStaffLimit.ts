import { ref } from "vue";
import { container } from "@/infrastructure/container";
import type { StaffLimit } from "@/domain/models/StaffLimit";
import type { StaffService } from "@/application/services/staffService";

const staffLimit = ref<StaffLimit | null>(null);

export function useStaffLimit() {
    const staffService = container.resolve<StaffService>("StaffService");

    const load = async () => {
        try {
            staffLimit.value = await staffService.getStaffLimit();
        } catch {
            staffLimit.value = null;
        }
    };

    return { staffLimit, load };
}
