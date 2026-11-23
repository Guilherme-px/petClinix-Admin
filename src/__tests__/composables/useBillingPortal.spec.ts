import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useBillingPortal } from "../../composables/useBillingPortal";
import type { PortalSession } from "../../domain/models/Billing";

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../infrastructure/container";

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: () => ({
            notify: notifyMock,
        }),
    };
});

const notifyMock = vi.fn<(opts: Record<string, unknown>) => void>();
const createPortalSessionMock = vi.fn<(returnUrl: string) => Promise<PortalSession>>();

const setupContainer = () => {
    vi.mocked(container.resolve).mockReturnValue({
        createPortalSession: createPortalSessionMock,
    });
};

const portalUrl = "https://billing.stripe.com/session/test_1";
const currentUrl = "http://localhost:5173/profile";

describe("useBillingPortal", () => {
    let locationMock: { href: string };

    beforeEach(() => {
        vi.clearAllMocks();
        createPortalSessionMock.mockReset();
        locationMock = { href: currentUrl };
        Object.defineProperty(window, "location", {
            value: locationMock,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        Reflect.deleteProperty(window, "location");
    });

    it("should start with isOpening as false", () => {
        setupContainer();

        const { isOpening } = useBillingPortal();

        expect(isOpening.value).toBe(false);
    });

    it("should call createPortalSession with the current url and redirect to the portal url", async () => {
        setupContainer();
        createPortalSessionMock.mockResolvedValue({ portalUrl });
        const { openBillingPortal } = useBillingPortal();

        await openBillingPortal();

        expect(createPortalSessionMock).toHaveBeenCalledWith(currentUrl);
        expect(locationMock.href).toBe(portalUrl);
        expect(notifyMock).not.toHaveBeenCalled();
    });

    it("should set isOpening while the portal session is pending", async () => {
        setupContainer();
        let resolveSession!: (value: PortalSession) => void;
        createPortalSessionMock.mockReturnValue(
            new Promise<PortalSession>((resolve) => (resolveSession = resolve)),
        );
        const { isOpening, openBillingPortal } = useBillingPortal();

        const pending = openBillingPortal();
        expect(isOpening.value).toBe(true);

        resolveSession({ portalUrl });
        await pending;

        expect(isOpening.value).toBe(false);
    });

    it("should return early without calling the service when already opening", async () => {
        setupContainer();
        let resolveSession!: (value: PortalSession) => void;
        createPortalSessionMock.mockReturnValue(
            new Promise<PortalSession>((resolve) => (resolveSession = resolve)),
        );
        const { isOpening, openBillingPortal } = useBillingPortal();

        const first = openBillingPortal();
        const second = openBillingPortal();
        resolveSession({ portalUrl });
        await Promise.all([first, second]);

        expect(createPortalSessionMock).toHaveBeenCalledTimes(1);
        expect(isOpening.value).toBe(false);
    });

    it("should notify negative with api errorMessage when opening fails", async () => {
        setupContainer();
        createPortalSessionMock.mockRejectedValue(
            Object.assign(new Error("Forbidden"), {
                data: { errorMessage: "Portal indisponível." },
            }),
        );
        const { isOpening, openBillingPortal } = useBillingPortal();

        await openBillingPortal();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Portal indisponível.",
            }),
        );
        expect(locationMock.href).toBe(currentUrl);
        expect(isOpening.value).toBe(false);
    });

    it("should notify negative with fallback message when error has no api data", async () => {
        setupContainer();
        createPortalSessionMock.mockRejectedValue(new Error("Network Error"));
        const { isOpening, openBillingPortal } = useBillingPortal();

        await openBillingPortal();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao abrir o portal de assinatura.",
            }),
        );
        expect(locationMock.href).toBe(currentUrl);
        expect(isOpening.value).toBe(false);
    });
});
