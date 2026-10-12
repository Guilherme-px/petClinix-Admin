import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn } from "quasar";
import AppointmentFormDialog from "../../../components/forms/AppointmentFormDialog.vue";
import type {
    Appointment,
    RegisterAppointmentPayload,
    UpdateAppointmentPayload,
} from "../../../domain/models/Appointment";
import type { PetService } from "../../../application/services/petService";
import type { PaginatedResponse } from "../../../domain/models/pagination";
import type { AppointmentService } from "../../../application/services/appointmentService";
import { validationsMock } from "../../../test/mocks/useValidations";
import { QDialogStub, QTooltipStub } from "../../../test/helpers/stubs";
import { findInputByLabel, setInput } from "../../../test/helpers/quasarUtils";
import { createMockAppointment } from "../../../test/factories/appointmentFactory";
import { createMockPet, createPaginatedPets } from "../../../test/factories/petFactory";

vi.mock("@/composables/useValidations", () => ({
    useValidations: () => validationsMock,
}));

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../../infrastructure/container";

const veterinarians = [{ id: "vet-1", name: "Dr. João" }];
const tutors = [{ id: "tutor-1", name: "Guilherme", phone: "11999998888" }];
const services = [{ id: "service-1", name: "Consulta", price: 100, durationInMinutes: 30 }];

const listPetsMock =
    vi.fn<
        (
            tutorId: string,
            params: { pageNumber: number; pageSize: number; search: string },
        ) => Promise<PaginatedResponse<Pet>>
    >();
const getAvailableSlotsMock =
    vi.fn<(vetId: string, serviceId: string, date: string) => Promise<string[]>>();

const petServiceMock = {
    list: listPetsMock,
    getById: vi.fn<(tutorId: string, petId: string) => Promise<Pet>>(),
    register: vi.fn<(tutorId: string, payload: PetPayload) => Promise<void>>(),
    update: vi.fn<(tutorId: string, petId: string, payload: PetPayload) => Promise<void>>(),
    remove: vi.fn<(tutorId: string, petId: string) => Promise<void>>(),
} as unknown as PetService;

const appointmentServiceMock = {
    listByRange: vi.fn<(startDate: string, endDate: string) => Promise<Appointment[]>>(),
    getById: vi.fn<(id: string) => Promise<Appointment>>(),
    register: vi.fn<(payload: RegisterAppointmentPayload) => Promise<void>>(),
    update: vi.fn<(id: string, payload: UpdateAppointmentPayload) => Promise<void>>(),
    updateStatus: vi.fn<(id: string, status: string) => Promise<void>>(),
    getAvailableSlots: getAvailableSlotsMock,
} as unknown as AppointmentService;

const todayKey = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const mountDialog = (
    props: { appointment?: Appointment | null; isLoading?: boolean } = {},
    modelValue = true,
) =>
    mount(AppointmentFormDialog, {
        props: {
            appointment: null,
            isLoading: false,
            modelValue,
            veterinarians,
            tutors,
            services,
            ...props,
        },
        global: {
            stubs: { QDialog: QDialogStub, QTooltip: QTooltipStub },
        },
    });

const submitThroughQForm = async (wrapper: ReturnType<typeof mountDialog>) => {
    wrapper.findComponent({ name: "QForm" }).vm.$emit("submit");
    await flushPromises();
};

const findSelectByLabel = (wrapper: ReturnType<typeof mountDialog>, label: string) =>
    wrapper.findAllComponents({ name: "QSelect" }).find((s) => s.props("label") === label);

const setSelect = async (wrapper: ReturnType<typeof mountDialog>, label: string, value: string) => {
    await findSelectByLabel(wrapper, label)!.vm.$emit("update:modelValue", value);
    await flushPromises();
};

describe("AppointmentFormDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(container.resolve).mockImplementation((key: string) => {
            if (key === "PetService") return petServiceMock;
            if (key === "AppointmentService") return appointmentServiceMock;
            return undefined;
        });
        listPetsMock.mockResolvedValue(
            createPaginatedPets({
                items: [
                    createMockPet({ id: "pet-1", name: "Rex" }),
                    createMockPet({ id: "pet-2", name: "Bolinha" }),
                ],
                totalCount: 2,
            }),
        );
        getAvailableSlotsMock.mockResolvedValue(["08:00", "09:00"]);
    });

    it("should render create mode with empty selects and Salvar label", () => {
        const wrapper = mountDialog();

        expect(wrapper.text()).toContain("Novo Agendamento");
        expect(findSelectByLabel(wrapper, "Tutor")!.props("modelValue")).toBe("");
        expect(findSelectByLabel(wrapper, "Horário")!.props("modelValue")).toBe("");
        expect(findInputByLabel(wrapper, "Data")!.attributes("min")).toBe(todayKey());

        const submit = wrapper.findAllComponents(QBtn).find((b) => b.props("type") === "submit")!;
        expect(submit.text()).toBe("Salvar");
    });

    it("should render edit mode populated with Atualizar label", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        expect(wrapper.text()).toContain("Editar Agendamento");
        expect(findSelectByLabel(wrapper, "Tutor")!.props("modelValue")).toBe("tutor-1");
        expect(findSelectByLabel(wrapper, "Horário")!.props("modelValue")).toBe("10:30");
        expect(findInputByLabel(wrapper, "Data")!.element.value).toBe("2026-10-10");

        const submit = wrapper.findAllComponents(QBtn).find((b) => b.props("type") === "submit")!;
        expect(submit.text()).toBe("Atualizar");
    });

    it("should show hint when tutor has no pets", async () => {
        listPetsMock.mockResolvedValue(createPaginatedPets({ items: [], totalCount: 0 }));
        const wrapper = mountDialog();
        await flushPromises();

        await setSelect(wrapper, "Tutor", "tutor-1");
        await flushPromises();

        expect(wrapper.text()).toContain("Nenhum pet cadastrado para este tutor");
    });

    it("should not load pets or slots in create mode", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        expect(listPetsMock).not.toHaveBeenCalled();
        expect(getAvailableSlotsMock).not.toHaveBeenCalled();
        expect(findSelectByLabel(wrapper, "Horário")!.props("disable")).toBe(true);
    });

    it("should load pet options when opened with an appointment", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        expect(listPetsMock).toHaveBeenCalledWith("tutor-1", {
            pageNumber: 1,
            pageSize: 100,
            search: "",
        });
        expect(findSelectByLabel(wrapper, "Pet")!.props("options")).toEqual([
            { label: "Rex", value: "pet-1" },
            { label: "Bolinha", value: "pet-2" },
        ]);
    });

    it("should load slots and enable time select when schedule trio completes", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setSelect(wrapper, "Veterinário", "vet-1");
        await setSelect(wrapper, "Serviço", "service-1");
        await setInput(wrapper, "Data", "2026-10-10");
        await flushPromises();

        expect(getAvailableSlotsMock).toHaveBeenCalledWith("vet-1", "service-1", "2026-10-10");
        expect(findSelectByLabel(wrapper, "Horário")!.props("disable")).toBe(false);
        expect(findSelectByLabel(wrapper, "Horário")!.props("options")).toEqual([
            { label: "08:00", value: "08:00" },
            { label: "09:00", value: "09:00" },
        ]);
    });

    it("should keep the current slot in options when editing without schedule changes", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        const timeSelect = findSelectByLabel(wrapper, "Horário")!;
        const values = (timeSelect.props("options") as { value: string }[]).map((o) => o.value);

        expect(values).toContain("10:30");
    });

    it("should drop the current slot and reset time when veterinarian changes", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        await setSelect(wrapper, "Veterinário", "vet-2");

        expect(getAvailableSlotsMock).toHaveBeenCalledWith("vet-2", "service-1", "2026-10-10");
        expect(findSelectByLabel(wrapper, "Horário")!.props("modelValue")).toBe("");

        const values = (
            findSelectByLabel(wrapper, "Horário")!.props("options") as { value: string }[]
        ).map((o) => o.value);
        expect(values).not.toContain("10:30");
    });

    it("should reset pet options when tutor changes", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        await setSelect(wrapper, "Tutor", "tutor-2");

        expect(findSelectByLabel(wrapper, "Pet")!.props("modelValue")).toBe("");
        expect(listPetsMock).toHaveBeenLastCalledWith("tutor-2", {
            pageNumber: 1,
            pageSize: 100,
            search: "",
        });
    });

    it("should reset form and pet options when opened without appointment after edit", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        await wrapper.setProps({ appointment: null });
        await flushPromises();

        expect(findSelectByLabel(wrapper, "Tutor")!.props("modelValue")).toBe("");
        expect(findSelectByLabel(wrapper, "Pet")!.props("options")).toEqual([]);
        expect(findInputByLabel(wrapper, "Data")!.element.value).toBe("");
    });

    it("should emit full register payload on create submit", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setSelect(wrapper, "Tutor", "tutor-1");
        await setSelect(wrapper, "Pet", "pet-1");
        await setSelect(wrapper, "Veterinário", "vet-1");
        await setSelect(wrapper, "Serviço", "service-1");
        await setInput(wrapper, "Data", "2026-10-10");
        await setSelect(wrapper, "Horário", "08:00");
        await setInput(wrapper, "Observações", "  Rotina  ");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")?.[0]?.[0] as RegisterAppointmentPayload;
        expect(payload).toEqual({
            tutorId: "tutor-1",
            petId: "pet-1",
            serviceId: "service-1",
            veterinarianId: "vet-1",
            date: "2026-10-10",
            time: "08:00",
            notes: "Rotina",
        });
    });

    it("should emit update payload without tutor and pet on edit submit", async () => {
        const wrapper = mountDialog({ appointment: createMockAppointment() });
        await flushPromises();

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")?.[0]?.[0] as UpdateAppointmentPayload;
        expect(payload).toEqual({
            veterinarianId: "vet-1",
            serviceId: "service-1",
            date: "2026-10-10",
            time: "10:30",
            notes: "Observação de teste",
        });
        expect(payload).not.toHaveProperty("tutorId");
        expect(payload).not.toHaveProperty("petId");
    });

    it("should emit null notes when left empty", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await setSelect(wrapper, "Tutor", "tutor-1");
        await setSelect(wrapper, "Pet", "pet-1");
        await setSelect(wrapper, "Veterinário", "vet-1");
        await setSelect(wrapper, "Serviço", "service-1");
        await setInput(wrapper, "Data", "2026-10-10");
        await setSelect(wrapper, "Horário", "08:00");
        await setInput(wrapper, "Observações", "   ");

        await submitThroughQForm(wrapper);

        const payload = wrapper.emitted("submit")?.[0]?.[0] as RegisterAppointmentPayload;
        expect(payload.notes).toBeNull();
    });

    it("should propagate dialog close request to the model", async () => {
        const wrapper = mountDialog();
        await flushPromises();

        await wrapper.findComponent(QDialogStub).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    });

    it("should skip work while closed and populate when opened", async () => {
        const wrapper = mountDialog({}, false);
        await flushPromises();

        expect(listPetsMock).not.toHaveBeenCalled();
        expect(getAvailableSlotsMock).not.toHaveBeenCalled();

        await wrapper.setProps({ modelValue: true, appointment: createMockAppointment() });
        await flushPromises();

        expect(listPetsMock).toHaveBeenCalledWith("tutor-1", {
            pageNumber: 1,
            pageSize: 100,
            search: "",
        });
        expect(getAvailableSlotsMock).toHaveBeenCalled();
    });

    it("should reflect isLoading on the submit button", () => {
        const wrapper = mountDialog({ isLoading: true });

        const submit = wrapper.findAllComponents(QBtn).find((b) => b.props("type") === "submit")!;
        expect(submit.props("loading")).toBe(true);
    });
});
