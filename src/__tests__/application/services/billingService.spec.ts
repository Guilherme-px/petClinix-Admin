import { describe, it, expect, vi } from "vitest";
import { createBillingService } from "../../../application/services/billingService";
import type { PortalSession } from "../../../domain/models/Billing";

describe("billingService", () => {
    const createRepoMock = () => {
        const repo = {
            createPortalSession: vi.fn<(returnUrl: string) => Promise<PortalSession>>(),
        };
        return { repo, createPortalSessionMock: repo.createPortalSession };
    };

    it("should call repository with the return url and pass the portal url through", async () => {
        const { repo, createPortalSessionMock } = createRepoMock();
        createPortalSessionMock.mockResolvedValue({ portalUrl: "https://billing.stripe.com/session/test_1" });

        const result = await createBillingService(repo).createPortalSession(
            "http://localhost:5173/profile",
        );

        expect(createPortalSessionMock).toHaveBeenCalledWith("http://localhost:5173/profile");
        expect(result).toEqual({ portalUrl: "https://billing.stripe.com/session/test_1" });
    });

    it("should propagate errors from repository", async () => {
        const { repo, createPortalSessionMock } = createRepoMock();
        createPortalSessionMock.mockRejectedValue(new Error("Forbidden"));

        await expect(
            createBillingService(repo).createPortalSession("http://localhost"),
        ).rejects.toThrow("Forbidden");
    });
});
