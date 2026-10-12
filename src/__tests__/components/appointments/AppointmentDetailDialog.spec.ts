import { describe, it, expect, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import AppointmentDetailDialog from "../../../components/appointments/AppointmentDetailDialog.vue";
import type { Appointment, AppointmentStatus } from "../../../domain/models/Appointment";
import { createMockAppointment } from "../../../test/factories/appointmentFactory";
import { QDialogStub } from "../../../test/helpers/stubs";

type Veterinarian = { id: string; name: string };
type Tutor = { id: string; name: string; phone: string | null };
type Service = { id: string; name: string; price: number; durationInMinutes: number };

const veterinarians: Veterinarian[] = [{ id: "vet-1", name: "Dr. João" }];
const tutors: Tutor[] = [{ id: "tutor-1", name: "Guilherme", phone: "11999998888" }];
const services: Service[] = [
    { id: "service-1", name: "Consulta de rotina", price: 100, durationInMinutes: 30 },
];

interface MountOptions {
    appointment?: Appointment;
    isLoading?: boolean;
    veterinarians?: Veterinarian[];
    tutors?: Tutor[];
    services?: Service[];
}

const mountDialog = (overrides: MountOptions = {}) =>
    mount(AppointmentDetailDialog, {
        props: {
            modelValue: true,
            appointment: createMockAppointment(),
            isLoading: false,
            veterinarians,
            tutors,
            services,
            ...overrides,
        },
        global: {
            stubs: { QDialog: QDialogStub },
        },
    });

const findButtonByLabel = (wrapper: ReturnType<typeof mountDialog>, label: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("label") === label);

const findWhatsAppButton = (wrapper: ReturnType<typeof mountDialog>) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "fab fa-whatsapp");

const originalUserAgent = window.navigator.userAgent;
const originalPlatform = window.navigator.platform;
const originalMaxTouchPoints = window.navigator.maxTouchPoints;

const setUserAgent = (value: string) => {
    Object.defineProperty(window.navigator, "userAgent", { value, configurable: true });
};

const setNavigator = (props: { platform?: string; maxTouchPoints?: number }) => {
    if (props.platform !== undefined)
        Object.defineProperty(window.navigator, "platform", {
            value: props.platform,
            configurable: true,
        });
    if (props.maxTouchPoints !== undefined)
        Object.defineProperty(window.navigator, "maxTouchPoints", {
            value: props.maxTouchPoints,
            configurable: true,
        });
};

describe("AppointmentDetailDialog", () => {
    afterEach(() => {
        setUserAgent(originalUserAgent);
        setNavigator({ platform: originalPlatform, maxTouchPoints: originalMaxTouchPoints });
    });

    it("should render veterinarian, tutor, service, price and formatted date", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Dr. João");
        expect(wrapper.text()).toContain("Guilherme");
        expect(wrapper.text()).toContain("Consulta de rotina");
        expect(wrapper.text()).toContain("100,00");
        expect(wrapper.text()).toContain("Sábado, 10 de outubro");
        expect(wrapper.text()).toContain("10:30 às 11:00");
    });

    it("should format phone with 11 digits and point whatsapp to desktop", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("(11) 99999-8888");
        expect(findWhatsAppButton(wrapper)!.attributes("href")).toBe(
            "https://web.whatsapp.com/send?phone=5511999998888",
        );
    });

    it("should point whatsapp to the app deep link on mobile", () => {
        setUserAgent(
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        );
        const wrapper = mountDialog();

        expect(findWhatsAppButton(wrapper)!.attributes("href")).toBe("https://wa.me/5511999998888");
    });

    it("should format phone with 10 digits", () => {
        const wrapper = mountDialog({
            tutors: [{ id: "tutor-1", name: "Guilherme", phone: "1133334444" }],
        });

        expect(wrapper.text()).toContain("(11) 3333-4444");
    });

    it("should render raw phone when length is unexpected", () => {
        const wrapper = mountDialog({
            tutors: [{ id: "tutor-1", name: "Guilherme", phone: "123" }],
        });

        expect(wrapper.text()).toContain("Telefone:");
        expect(wrapper.text()).toContain("123");
    });

    it("should hide phone row when tutor has no phone", () => {
        const wrapper = mountDialog({
            tutors: [{ id: "tutor-1", name: "Guilherme", phone: null }],
        });

        expect(wrapper.text()).not.toContain("Telefone:");
        expect(findWhatsAppButton(wrapper)).toBeUndefined();
    });

    it("should fall back to em dash when lookups do not contain the ids", () => {
        const wrapper = mountDialog({ veterinarians: [], tutors: [], services: [] });

        expect(wrapper.text()).toContain("—");
        expect(wrapper.text()).not.toContain("Dr. João");
        expect(wrapper.text()).not.toContain("Guilherme");
        expect(wrapper.text()).not.toContain("Consulta de rotina");
        expect(wrapper.text()).not.toContain("Valor:");
        expect(wrapper.text()).toContain("10:30");
        expect(wrapper.text()).not.toContain("às");
        expect(findWhatsAppButton(wrapper)).toBeUndefined();
    });

    it.each([
        ["Scheduled", "Agendado"],
        ["Confirmed", "Confirmado"],
        ["Completed", "Concluído"],
        ["Canceled", "Cancelado"],
        ["NoShow", "Falta"],
    ])("should render label for status %s", (status, label) => {
        const wrapper = mountDialog({
            appointment: createMockAppointment({ status: status as AppointmentStatus }),
        });

        expect(wrapper.text()).toContain(label);
    });

    it("should render status dot color for known status", () => {
        const wrapper = mountDialog();
        const style = wrapper.find(".status-dot").attributes("style") ?? "";

        expect(style.includes("#2196F3") || style.includes("33, 150, 243")).toBe(true);
    });

    it("should render raw status with neutral dot when status is unknown", () => {
        const wrapper = mountDialog({
            appointment: createMockAppointment({ status: "Unknown" as AppointmentStatus }),
        });

        expect(wrapper.text()).toContain("Unknown");

        const style = wrapper.find(".status-dot").attributes("style") ?? "";
        expect(style.includes("#9E9E9E") || style.includes("158, 158, 158")).toBe(true);
    });

    it.each(["Scheduled", "Confirmed"])("should enable actions for %s", (status) => {
        const wrapper = mountDialog({
            appointment: createMockAppointment({ status: status as AppointmentStatus }),
        });

        expect(findButtonByLabel(wrapper, "Editar")!.props("disable")).toBe(false);
        expect(findButtonByLabel(wrapper, "Cancelar Agendamento")!.props("disable")).toBe(false);
    });

    it.each(["Completed", "Canceled", "NoShow"])("should disable actions for %s", (status) => {
        const wrapper = mountDialog({
            appointment: createMockAppointment({ status: status as AppointmentStatus }),
        });

        expect(findButtonByLabel(wrapper, "Editar")!.props("disable")).toBe(true);
        expect(findButtonByLabel(wrapper, "Cancelar Agendamento")!.props("disable")).toBe(true);
    });

    it("should disable actions while loading", () => {
        const wrapper = mountDialog({ isLoading: true });

        expect(findButtonByLabel(wrapper, "Editar")!.props("disable")).toBe(true);
        expect(findButtonByLabel(wrapper, "Cancelar Agendamento")!.props("disable")).toBe(true);
    });

    it("should emit edit and cancel when action buttons are clicked", async () => {
        const wrapper = mountDialog();

        await findButtonByLabel(wrapper, "Editar")!.trigger("click");
        await findButtonByLabel(wrapper, "Cancelar Agendamento")!.trigger("click");

        expect(wrapper.emitted("edit")).toHaveLength(1);
        expect(wrapper.emitted("cancel")).toHaveLength(1);
    });

    it("should render raw phone and neutral whatsapp link when phone has no digits", () => {
        const wrapper = mountDialog({
            tutors: [{ id: "tutor-1", name: "Guilherme", phone: "(sem número)" }],
        });

        expect(wrapper.text()).toContain("(sem número)");
        expect(findWhatsAppButton(wrapper)!.attributes("href")).toBe("#");
    });

    it("should treat iPad as mobile via touch points when user agent is desktop", () => {
        setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
        );
        setNavigator({ platform: "MacIntel", maxTouchPoints: 2 });

        const wrapper = mountDialog();

        expect(findWhatsAppButton(wrapper)!.attributes("href")).toBe("https://wa.me/5511999998888");
    });

    it("should return empty price when service is not found", () => {
        const wrapper = mountDialog({ services: [] });
        const vm = wrapper.vm as unknown as { formattedPrice: string };

        expect(vm.formattedPrice).toBe("");
    });

    it("should expose neutral phone and whatsapp url when tutor is not found", () => {
        const wrapper = mountDialog({ tutors: [] });
        const vm = wrapper.vm as unknown as {
            formattedPhone: string;
            whatsappUrl: string;
        };

        expect(vm.formattedPhone).toBe("");
        expect(vm.whatsappUrl).toBe("#");
    });

    it("should propagate dialog close request to the model", async () => {
        const wrapper = mountDialog();

        await wrapper.findComponent(QDialogStub).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });
});
