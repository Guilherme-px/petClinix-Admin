import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppointmentStatusLegend from "../../../components/appointments/AppointmentStatusLegend.vue";
import {
    APPOINTMENT_STATUS_LABELS,
    APPOINTMENT_STATUS_COLORS,
} from "../../../domain/models/Appointment";

const hexToRgbTriple = (hex: string) => {
    const digits = hex.replace("#", "");
    const full =
        digits.length === 3
            ? digits
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : digits;

    return {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
};

describe("AppointmentStatusLegend", () => {
    it("should render one item per appointment status", () => {
        const wrapper = mount(AppointmentStatusLegend);

        expect(wrapper.findAll(".status-legend__item")).toHaveLength(
            Object.keys(APPOINTMENT_STATUS_LABELS).length,
        );
    });

    it("should render every status label from domain", () => {
        const wrapper = mount(AppointmentStatusLegend);

        for (const label of Object.values(APPOINTMENT_STATUS_LABELS)) {
            expect(wrapper.text()).toContain(label);
        }
    });

    it("should render dot with the domain color for each status", () => {
        const wrapper = mount(AppointmentStatusLegend);
        const dots = wrapper.findAll(".status-legend__dot");
        const expectedColors = Object.values(APPOINTMENT_STATUS_COLORS);

        expect(dots).toHaveLength(expectedColors.length);

        dots.forEach((dot, index) => {
            const style = dot.attributes("style") ?? "";
            const expected = expectedColors[index]!;

            const expectedRgb = hexToRgbTriple(expected);
            const numbersInStyle = style.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];

            expect(
                style.toLowerCase().includes(expected.toLowerCase()) ||
                    (numbersInStyle.length >= 3 &&
                        numbersInStyle[0] === expectedRgb.r &&
                        numbersInStyle[1] === expectedRgb.g &&
                        numbersInStyle[2] === expectedRgb.b),
            ).toBe(true);
        });
    });
});
