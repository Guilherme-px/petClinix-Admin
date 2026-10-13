import { describe, it, expect } from "vitest";
import { appointmentStatusLabel, appointmentStatusColor } from "../../../domain/models/Appointment";

describe("appointmentStatusLabel", () => {
    it.each([
        ["Scheduled", "Agendado"],
        ["Confirmed", "Confirmado"],
        ["Completed", "Concluído"],
        ["Canceled", "Cancelado"],
        ["NoShow", "Falta"],
    ])("should map %s to its label", (status, label) => {
        expect(appointmentStatusLabel(status)).toBe(label);
    });

    it("should return the raw status as label when it is unknown", () => {
        expect(appointmentStatusLabel("Unknown")).toBe("Unknown");
    });
});

describe("appointmentStatusColor", () => {
    it.each([
        ["Scheduled", "#2196F3"],
        ["Confirmed", "#009688"],
        ["Completed", "#4CAF50"],
        ["Canceled", "#F44336"],
        ["NoShow", "#BF360C"],
    ])("should map %s to its color", (status, color) => {
        expect(appointmentStatusColor(status)).toBe(color);
    });

    it("should return the neutral color when status is unknown", () => {
        expect(appointmentStatusColor("Unknown")).toBe("#9E9E9E");
    });
});
