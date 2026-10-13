import type { IBillingRepository } from "@/domain/repositories/IBillingRepository";
import type { PortalSession } from "@/domain/models/Billing";

export const createBillingService = (billingRepository: IBillingRepository) => {
    return {
        async createPortalSession(returnUrl: string): Promise<PortalSession> {
            return await billingRepository.createPortalSession(returnUrl);
        },
    };
};

export type BillingService = ReturnType<typeof createBillingService>;
