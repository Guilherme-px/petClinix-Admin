import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { nextTick } from "vue";
import GlobalLoadingOverlay from "../../../components/common/GlobalLoadingOverlay.vue";
import { useLoadingStore } from "../../../stores/loading";

describe("GlobalLoadingOverlay", () => {
    let wrapper: VueWrapper | null = null;

    const mountOverlay = () => {
        wrapper = mount(GlobalLoadingOverlay, {
            attachTo: document.body,
        });
        return useLoadingStore();
    };

    afterEach(() => {
        wrapper?.unmount();
        wrapper = null;
        document.body.innerHTML = "";
        vi.useRealTimers();
    });

    it("should not render when there is no pending request", () => {
        mountOverlay();
        expect(document.body.querySelector(".global-loading-overlay")).toBeNull();
    });

    it("should render the initial message when visible", async () => {
        const store = mountOverlay();
        store.startedAt = Date.now();
        store.isVisible = true;
        await nextTick();
        const message = document.body.querySelector(".global-loading-message");
        expect(message?.textContent).toBe("Carregando...");
    });

    it("should keep the initial message when there is no started timestamp", async () => {
        const store = mountOverlay();
        store.startedAt = 0;
        store.isVisible = true;
        await nextTick();
        const message = document.body.querySelector(".global-loading-message");
        expect(message?.textContent).toBe("Carregando...");
    });

    it("should render the connecting message between 4 and 15 seconds", async () => {
        const store = mountOverlay();
        store.startedAt = Date.now() - 8000;
        store.isVisible = true;
        await nextTick();
        const message = document.body.querySelector(".global-loading-message");
        expect(message?.textContent).toBe("Conectando ao servidor...");
    });

    it("should render the server startup message after a long wait", async () => {
        const store = mountOverlay();
        store.startedAt = Date.now() - 20000;
        store.isVisible = true;
        await nextTick();
        const message = document.body.querySelector(".global-loading-message");
        expect(message?.textContent).toContain("iniciando");
    });

    it("should update the message as elapsed time grows", async () => {
        vi.useFakeTimers();
        const store = mountOverlay();
        store.startedAt = Date.now();
        store.isVisible = true;
        await nextTick();
        expect(document.body.querySelector(".global-loading-message")?.textContent).toBe(
            "Carregando...",
        );

        vi.advanceTimersByTime(5000);
        await nextTick();
        expect(document.body.querySelector(".global-loading-message")?.textContent).toBe(
            "Conectando ao servidor...",
        );

        vi.advanceTimersByTime(11000);
        await nextTick();
        expect(document.body.querySelector(".global-loading-message")?.textContent).toContain(
            "iniciando",
        );
    });

    it("should remove the overlay when loading becomes invisible", async () => {
        const store = mountOverlay();
        store.isVisible = true;
        await nextTick();
        expect(document.body.querySelector(".global-loading-overlay")).not.toBeNull();
        store.isVisible = false;
        await nextTick();
        expect(document.body.querySelector(".global-loading-overlay")).toBeNull();
    });
});
