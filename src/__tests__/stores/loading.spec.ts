import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useLoadingStore, resolveLoadingStore } from "../../stores/loading";

describe("LoadingStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setActivePinia(createPinia());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should not be visible immediately after begin", () => {
        const store = useLoadingStore();
        store.begin();
        expect(store.isVisible).toBe(false);
        expect(store.hasPendingRequests).toBe(true);
    });

    it("should become visible after the show delay", () => {
        const store = useLoadingStore();
        store.begin();
        vi.advanceTimersByTime(800);
        expect(store.isVisible).toBe(true);
    });

    it("should not become visible when request finishes before the delay", () => {
        const store = useLoadingStore();
        store.begin();
        store.end();
        vi.advanceTimersByTime(800);
        expect(store.isVisible).toBe(false);
        expect(store.hasPendingRequests).toBe(false);
        expect(store.startedAt).toBeNull();
    });

    it("should not show the overlay when a stale timer fires without pending requests", () => {
        const store = useLoadingStore();
        store.begin();
        store.pendingCount = 0;
        vi.advanceTimersByTime(800);
        expect(store.isVisible).toBe(false);
    });

    it("should stay visible while any request is still pending", () => {
        const store = useLoadingStore();
        store.begin();
        store.begin();
        vi.advanceTimersByTime(800);
        expect(store.isVisible).toBe(true);
        store.end();
        expect(store.isVisible).toBe(true);
        store.end();
        expect(store.isVisible).toBe(false);
        expect(store.startedAt).toBeNull();
    });

    it("should ignore end when there is no pending request", () => {
        const store = useLoadingStore();
        store.end();
        expect(store.pendingCount).toBe(0);
    });

    it("should end cleanly when the show timer was never scheduled", () => {
        const store = useLoadingStore();
        store.pendingCount = 1;
        store.end();
        expect(store.isVisible).toBe(false);
        expect(store.startedAt).toBeNull();
    });

    it("should restart the show timer for a new request cycle", () => {
        const store = useLoadingStore();
        store.begin();
        store.end();
        store.begin();
        vi.advanceTimersByTime(799);
        expect(store.isVisible).toBe(false);
        vi.advanceTimersByTime(1);
        expect(store.isVisible).toBe(true);
    });

    it("should resolve the store when pinia is active", () => {
        const resolved = resolveLoadingStore();
        expect(resolved).not.toBeNull();
        resolved?.begin();
        expect(resolved?.hasPendingRequests).toBe(true);
    });

    it("should return null when pinia is not active", () => {
        setActivePinia(undefined);
        expect(resolveLoadingStore()).toBeNull();
    });
});
