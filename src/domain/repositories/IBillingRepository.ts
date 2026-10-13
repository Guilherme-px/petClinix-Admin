import type { PortalSession } from "@/domain/models/Billing";

export interface IBillingRepository {
    createPortalSession(returnUrl: string): Promise<PortalSession>;
}

