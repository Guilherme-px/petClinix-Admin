import { describe, it, expect } from "vitest";
import { container } from "@/infrastructure/container";

describe("Container", () => {
    it("should resolve a registered service", () => {
        const authService = container.resolve<unknown>("AuthService");
        expect(authService).toBeDefined();
        expect(typeof (authService as { login: unknown }).login).toBe("function");
    });

    it("should throw error if service is not found", () => {
        expect(() => container.resolve("UnknownService")).toThrowError(
            "Service UnknownService not found in container."
        );
    });
});
