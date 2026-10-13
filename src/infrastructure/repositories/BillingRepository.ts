import type { IBillingRepository } from "@/domain/repositories/IBillingRepository";
import type { PortalSession } from "@/domain/models/Billing";
import { HttpClient } from "@/infrastructure/http/HttpClient";

const BASE_URL = "/api/subscriptions";

export class BillingRepository implements IBillingRepository {
    private httpClient: HttpClient;

    constructor(httpClient: HttpClient) {
        this.httpClient = httpClient;
    }

    async createPortalSession(returnUrl: string): Promise<PortalSession> {
        return this.httpClient.post<PortalSession>(`${BASE_URL}/portal`, { returnUrl });
    }
}
