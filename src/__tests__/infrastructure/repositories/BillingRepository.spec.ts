import { describe, it, expect, beforeEach } from "vitest";
import { BillingRepository } from "../../../infrastructure/repositories/BillingRepository";
import { HttpClient } from "../../../infrastructure/http/HttpClient";
import { createHttpClientMock, HttpClientMock } from "../../../test/helpers/mockHttpClient";

describe("BillingRepository", () => {
    let httpClientMock: HttpClientMock;
    let billingRepository: BillingRepository;

    beforeEach(() => {
        httpClientMock = createHttpClientMock();
        billingRepository = new BillingRepository(httpClientMock as unknown as HttpClient);
    });

    it("should call portal endpoint with return url in payload", async () => {
        const expected = { portalUrl: "https://billing.stripe.com/session/test_1" };
        httpClientMock.post.mockResolvedValue(expected);

        const result = await billingRepository.createPortalSession("http://localhost:5173/profile");

        expect(httpClientMock.post).toHaveBeenCalledWith("/api/subscriptions/portal", {
            returnUrl: "http://localhost:5173/profile",
        });
        expect(result).toEqual(expected);
    });

    it("should pass through whatever portal url the api returns", async () => {
        const different = { portalUrl: "https://billing.stripe.com/session/other" };
        httpClientMock.post.mockResolvedValue(different);

        const result = await billingRepository.createPortalSession("http://localhost");

        expect(result.portalUrl).toBe("https://billing.stripe.com/session/other");
    });

    it("should propagate errors from http client", async () => {
        httpClientMock.post.mockRejectedValue(new Error("Forbidden"));

        await expect(billingRepository.createPortalSession("http://localhost")).rejects.toThrow(
            "Forbidden",
        );
    });
});
