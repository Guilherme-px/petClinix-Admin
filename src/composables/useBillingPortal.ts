import { ref } from "vue";
import { useQuasar } from "quasar";
import { container } from "@/infrastructure/container";
import type { BillingService } from "@/application/services/billingService";
import { getErrorMessage } from "@/infrastructure/http/errorHandler";

export const useBillingPortal = () => {
    const $q = useQuasar();
    const billingService = container.resolve<BillingService>("BillingService");
    const isOpening = ref(false);

    const openBillingPortal = async (): Promise<void> => {
        if (isOpening.value) {
            return;
        }

        isOpening.value = true;
        try {
            const { portalUrl } = await billingService.createPortalSession(window.location.href);
            window.location.href = portalUrl;
        } catch (error) {
            $q.notify({
                type: "negative",
                message: getErrorMessage(error, "Erro ao abrir o portal de assinatura."),
            });
        } finally {
            isOpening.value = false;
        }
    };

    return {
        isOpening,
        openBillingPortal,
    };
};
