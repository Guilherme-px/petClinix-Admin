import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { QBtn } from "quasar";
import { createTestingPinia, type TestingPinia } from "@pinia/testing";
import AdminLayout from "../../layouts/AdminLayout.vue";
import type { BillingService } from "../../application/services/billingService";
import { createMockUser } from "../../test/factories/authFactory";
import { screenState } from "../../test/helpers/mockQuasar";

const pushMock = vi.fn<(route: string) => void>();
const notifyMock = vi.fn<(opts: Record<string, unknown>) => void>();

vi.mock("vue-router", () => ({
    useRouter: () => ({ push: pushMock }),
}));

vi.mock("quasar", async (importOriginal) => {
    const actual = await importOriginal<typeof import("quasar")>();
    return {
        ...actual,
        useQuasar: () => ({
            notify: notifyMock,
            screen: screenState,
        }),
    };
});

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../infrastructure/container";
import { useAuthStore } from "../../stores/auth";

const createBillingServiceMock = (result: "ok" | "error" = "ok") => ({
    createPortalSession: vi
        .fn<(returnUrl: string) => Promise<{ portalUrl: string }>>()
        .mockImplementation((_returnUrl: string) =>
            result === "ok"
                ? Promise.resolve({ portalUrl: "https://billing.stripe.com/session/1" })
                : Promise.reject(new Error("Forbidden")),
        ),
});

const passthroughStub = (name: string) =>
    defineComponent({
        name,
        setup(_, { slots }) {
            return () => h("div", slots.default?.());
        },
    });

const QBtnDropdownStub = defineComponent({
    name: "QBtnDropdown",
    props: { label: { type: String, default: "" } },
    setup(props, { slots }) {
        return () =>
            h("div", { class: "dropdown-stub" }, [
                h("span", { class: "dropdown-stub__label" }, props.label),
                slots.default?.(),
            ]);
    },
});

const QDrawerStub = defineComponent({
    name: "QDrawer",
    props: { modelValue: { type: Boolean, default: false } },
    setup(_, { slots }) {
        return () => h("aside", slots.default?.());
    },
});

const mountLayout = () => {
    const pinia: TestingPinia = createTestingPinia();
    const wrapper = mount(AdminLayout, {
        global: {
            plugins: [pinia],
            stubs: {
                QLayout: passthroughStub("QLayout"),
                QHeader: passthroughStub("QHeader"),
                QDrawer: QDrawerStub,
                QPageContainer: passthroughStub("QPageContainer"),
                QBtnDropdown: QBtnDropdownStub,
                RouterView: true,
            },
        },
    });
    const store = useAuthStore();
    return { wrapper, store };
};

const findButtonByIcon = (wrapper: ReturnType<typeof mountLayout>["wrapper"], icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

const findItemByLabel = (wrapper: ReturnType<typeof mountLayout>["wrapper"], label: string) =>
    wrapper.findAllComponents({ name: "QItem" }).find((i) => i.text().includes(label));

const originalLocation = window.location;

describe("AdminLayout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(container.resolve).mockReturnValue(
            createBillingServiceMock("ok") as BillingService,
        );
    });

    afterEach(() => {
        Object.defineProperty(window, "location", { value: originalLocation, configurable: true });
    });

    it("should show loading screen while authenticating", async () => {
        const { wrapper, store } = mountLayout();
        store.isAuthenticating = true;
        await nextTick();

        expect(wrapper.find(".loading-screen").exists()).toBe(true);
        expect(wrapper.text()).toContain("Validando sessão...");
    });

    it("should render menu items when authenticated", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        for (const label of [
            "Agendamentos",
            "Clientes",
            "Pets",
            "Serviços",
            "Equipe",
            "Meu perfil",
        ]) {
            expect(wrapper.text()).toContain(label);
        }
    });

    it("should display first name when it is longer than 4 chars", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ name: "Guilherme Silva" });
        await nextTick();

        expect(wrapper.text()).toContain("Guilherme");
    });

    it("should display first and last name when first name is short", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ name: "Ana Souza" });
        await nextTick();

        expect(wrapper.text()).toContain("Ana Souza");
    });

    it("should display fallback label when user has no name", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ name: undefined });
        await nextTick();

        expect(wrapper.text()).toContain("Minha Conta");
    });

    it("should show subscription item only for admin", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();
        expect(wrapper.text()).toContain("Minha Assinatura");

        store.user = createMockUser({ role: "User" });
        await nextTick();
        expect(wrapper.text()).not.toContain("Minha Assinatura");
    });

    it("should navigate to profile on profile item click", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        await findItemByLabel(wrapper, "Meu Perfil")!.trigger("click");

        expect(pushMock).toHaveBeenCalledWith("/profile");
    });

    it("should logout and redirect on logout item click", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        await findItemByLabel(wrapper, "Sair")!.trigger("click");

        expect(store.logout).toHaveBeenCalled();
        expect(pushMock).toHaveBeenCalledWith("/login");
    });

    it("should toggle left drawer on menu button click", async () => {
        const { wrapper } = mountLayout();

        expect(findDrawer(wrapper).props("modelValue")).toBe(false);

        await findButtonByIcon(wrapper, "menu")!.trigger("click");

        expect(findDrawer(wrapper).props("modelValue")).toBe(true);
    });

    const findDrawer = (wrapper: ReturnType<typeof mountLayout>["wrapper"]) =>
        wrapper.findComponent({ name: "QDrawer" });

    it("should open billing portal and redirect to portal url", async () => {
        const serviceMock = createBillingServiceMock("ok");
        vi.mocked(container.resolve).mockReturnValue(serviceMock as BillingService);
        Object.defineProperty(window, "location", { value: { href: "" }, configurable: true });

        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        const returnUrl = window.location.href;

        await findItemByLabel(wrapper, "Minha Assinatura")!.trigger("click");
        await flushPromises();

        expect(serviceMock.createPortalSession).toHaveBeenCalledWith(returnUrl);
        expect(window.location.href).toBe("https://billing.stripe.com/session/1");
    });

    it("should show portal loading screen while creating session", async () => {
        let resolveSession!: (value: { portalUrl: string }) => void;
        vi.mocked(container.resolve).mockReturnValue({
            createPortalSession: vi
                .fn<(returnUrl: string) => Promise<{ portalUrl: string }>>()
                .mockImplementation(() => new Promise((resolve) => (resolveSession = resolve))),
        } as BillingService);

        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        await findItemByLabel(wrapper, "Minha Assinatura")!.trigger("click");
        await flushPromises();

        expect(wrapper.find(".loading-screen").exists()).toBe(true);
        expect(wrapper.text()).toContain("Abrindo portal de assinatura...");

        resolveSession({ portalUrl: "https://billing.stripe.com/session/1" });
        await flushPromises();
    });

    it("should notify and hide loading when portal session fails", async () => {
        vi.mocked(container.resolve).mockReturnValue(
            createBillingServiceMock("error") as BillingService,
        );

        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        await findItemByLabel(wrapper, "Minha Assinatura")!.trigger("click");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao abrir o portal de assinatura.",
            }),
        );
        expect(wrapper.find(".loading-screen").exists()).toBe(false);
    });

    it("should sync left drawer state when the drawer emits update:modelValue", async () => {
        const { wrapper } = mountLayout();

        expect(findDrawer(wrapper).props("modelValue")).toBe(false);

        await findDrawer(wrapper).vm.$emit("update:modelValue", true);
        await nextTick();

        expect(findDrawer(wrapper).props("modelValue")).toBe(true);
    });

    it("should display only the first name when there is no last name", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ name: "Guilherme" });
        await nextTick();

        expect(wrapper.text()).toContain("Guilherme");
    });

    it("should use second name for short first names with middle names", async () => {
        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ name: "Ana Clara Silva" });
        await nextTick();

        expect(wrapper.text()).toContain("Ana Clara");
    });

    it("should ignore repeated clicks while a portal session is opening", async () => {
        let resolveSession!: (value: { portalUrl: string }) => void;
        vi.mocked(container.resolve).mockReturnValue({
            createPortalSession: vi
                .fn<(returnUrl: string) => Promise<{ portalUrl: string }>>()
                .mockImplementation(() => new Promise((resolve) => (resolveSession = resolve))),
        } as BillingService);

        const { wrapper, store } = mountLayout();
        store.user = createMockUser({ role: "Admin" });
        await nextTick();

        const serviceMock = vi.mocked(container.resolve).mock.results[0]!.value as {
            createPortalSession: (returnUrl: string) => Promise<{ portalUrl: string }>;
        };

        const firstClick = findItemByLabel(wrapper, "Minha Assinatura")!.trigger("click");
        const secondClick = findItemByLabel(wrapper, "Minha Assinatura")!.trigger("click");

        await firstClick;
        resolveSession({ portalUrl: "https://billing.stripe.com/session/1" });
        await flushPromises();
        await secondClick;

        expect(serviceMock.createPortalSession).toHaveBeenCalledTimes(1);
    });
});
