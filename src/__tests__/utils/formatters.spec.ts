import { describe, it, expect } from "vitest";
import { formatPhone, formatCpf, formatDuration } from "../../utils/formatters";

describe("formatPhone", () => {
    it("should format mobile numbers with 11 digits", () => {
        expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
    });

    it("should format landline numbers with 10 digits", () => {
        expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
    });

    it("should strip formatting before reformatting", () => {
        expect(formatPhone("(11) 99999-8888")).toBe("(11) 99999-8888");
    });

    it("should return the raw value for unexpected lengths", () => {
        expect(formatPhone("123")).toBe("123");
        expect(formatPhone("")).toBe("");
        expect(formatPhone("119999988889")).toBe("119999988889");
    });
});

describe("formatCpf", () => {
    it("should format 11 digits with separators", () => {
        expect(formatCpf("12345678900")).toBe("123.456.789-00");
    });

    it("should strip formatting before reformatting", () => {
        expect(formatCpf("123.456.789-00")).toBe("123.456.789-00");
    });

    it("should return malformed values unchanged in non-digit positions", () => {
        expect(formatCpf("123")).toBe("123");
    });
});

describe("formatDuration", () => {
    it("should return dedicated label for zero duration", () => {
        expect(formatDuration(0)).toBe("Sem duração fixa");
    });

    it("should format minutes below one hour", () => {
        expect(formatDuration(1)).toBe("1 min");
        expect(formatDuration(30)).toBe("30 min");
        expect(formatDuration(59)).toBe("59 min");
    });

    it("should format exact hours without minutes", () => {
        expect(formatDuration(60)).toBe("1h");
        expect(formatDuration(120)).toBe("2h");
        expect(formatDuration(1440)).toBe("24h");
    });

    it("should format mixed hours and minutes", () => {
        expect(formatDuration(90)).toBe("1h 30min");
        expect(formatDuration(61)).toBe("1h 1min");
        expect(formatDuration(1500)).toBe("25h");
    });
});
