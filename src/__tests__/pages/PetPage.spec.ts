import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { QBtn, QSelect } from "quasar";
import PetPage from "../../pages/PetPage.vue";
import EmptyState from "../../components/common/EmptyState.vue";
import ConfirmDialog from "../../components/common/ConfirmDialog.vue";
import PetFormDialog from "../../components/forms/PetFormDialog.vue";
import type { FetchParams, PaginatedResponse } from "../../domain/models/pagination";
import type { Pet, PetPayload } from "../../domain/models/Pet";
import type { Tutor } from "../../domain/models/Tutor";
import {
    createMockPet,
    createPetPayload,
    createPaginatedPets,
} from "../../test/factories/petFactory";
import { createMockTutor, createPaginatedTutors } from "../../test/factories/tutorFactory";
import { QDialogStub, QPageStub, QTooltipStub } from "../../test/helpers/stubs";
import { screenState } from "../../test/helpers/mockQuasar";

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
            screen: screenState,
        }),
    };
});

const notifyMock = vi.fn<(opts: Record<string, unknown>) => void>();
const petListMock =
    vi.fn<(tutorId: string, params: FetchParams) => Promise<PaginatedResponse<Pet>>>();
const petRegisterMock = vi.fn<(tutorId: string, payload: PetPayload) => Promise<void>>();
const petUpdateMock =
    vi.fn<(tutorId: string, petId: string, payload: PetPayload) => Promise<void>>();
const petRemoveMock = vi.fn<(tutorId: string, petId: string) => Promise<void>>();
const tutorListMock = vi.fn<(params: FetchParams) => Promise<PaginatedResponse<Tutor>>>();

const mountPage = () =>
    mount(PetPage, {
        global: {
            stubs: {
                QDialog: QDialogStub,
                QTooltip: QTooltipStub,
                QPage: QPageStub,
            },
        },
    });

const setupContainer = (petResponse?: PaginatedResponse<Pet>) => {
    vi.mocked(container.resolve).mockImplementation((key: string) => {
        if (key === "PetService") {
            return {
                list: petListMock,
                getById: vi.fn<(tutorId: string, petId: string) => Promise<Pet>>(),
                register: petRegisterMock,
                update: petUpdateMock,
                remove: petRemoveMock,
            };
        }
        if (key === "TutorService") {
            return {
                list: tutorListMock,
                getById: vi.fn<(id: string) => Promise<Tutor>>(),
                register: vi.fn<(payload: never) => Promise<void>>(),
                update: vi.fn<(id: string, payload: never) => Promise<void>>(),
                remove: vi.fn<(id: string) => Promise<void>>(),
            };
        }
        return {};
    });

    tutorListMock.mockResolvedValue(
        createPaginatedTutors({
            items: [createMockTutor({ id: "tutor-1", name: "Maria Souza" })],
            totalCount: 1,
        }),
    );
    petListMock.mockResolvedValue(petResponse ?? createPaginatedPets());
};

const selectTutor = async (wrapper: ReturnType<typeof mount>) => {
    wrapper.findComponent(QSelect).vm.$emit("update:modelValue", "tutor-1");
    await flushPromises();
};

const findButtonByIcon = (wrapper: ReturnType<typeof mount>, icon: string) =>
    wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === icon);

describe("PetPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        screenState.lt.sm = false;
        notifyMock.mockClear();
        petListMock.mockReset();
        petRegisterMock.mockReset().mockResolvedValue(undefined);
        petUpdateMock.mockReset().mockResolvedValue(undefined);
        petRemoveMock.mockReset().mockResolvedValue(undefined);
        tutorListMock.mockReset();
    });

    it("should load tutors for the select on mount", async () => {
        setupContainer();
        mountPage();
        await flushPromises();

        expect(tutorListMock).toHaveBeenCalledWith({
            pageNumber: 1,
            pageSize: 100,
            search: "",
        });
    });

    it("should show tutor prompt empty state when no tutor is selected", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);
        expect(wrapper.text()).toContain("Selecione um tutor");
        expect(wrapper.find("thead").exists()).toBe(false);
        expect(petListMock).not.toHaveBeenCalled();
    });

    it("should load and render pets when tutor is selected", async () => {
        setupContainer(
            createPaginatedPets({
                items: [createMockPet(), createMockPet({ id: "pet-2", name: "Bolinha" })],
                totalCount: 2,
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(petListMock).toHaveBeenCalledWith("tutor-1", {
            pageNumber: 1,
            pageSize: 10,
            search: "",
        });
        expect(wrapper.text()).toContain("Rex");
        expect(wrapper.text()).toContain("Bolinha");
    });

    it("should show species and sex labels in table", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(wrapper.text()).toContain("Cão");
        expect(wrapper.text()).toContain("Macho");
    });

    it("should show no-pets empty state when selected tutor has no pets", async () => {
        setupContainer(createPaginatedPets({ items: [], totalCount: 0 }));
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);
        expect(wrapper.text()).toContain("Nenhum pet cadastrado");
        expect(wrapper.find("thead").exists()).toBe(false);
    });

    it("should have new pet button disabled until a tutor is selected", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        expect(newButton.props("disable")).toBe(true);

        await selectTutor(wrapper);

        expect(newButton.props("disable")).toBe(false);
    });

    it("should open create dialog with null pet when new button is clicked after selecting tutor", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");

        const formDialog = wrapper.findComponent(PetFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("pet")).toBeNull();
    });

    it("should open edit dialog populated when edit button is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const formDialog = wrapper.findComponent(PetFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("pet")).toMatchObject({ id: "pet-1", name: "Rex" });
    });

    it("should call register with tutor id on create submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(true);

        const payload = createPetPayload({ name: "Novo Pet" });
        await wrapper.findComponent(PetFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(petRegisterMock).toHaveBeenCalledWith("tutor-1", payload);
        expect(petUpdateMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Pet criado com sucesso!",
            }),
        );
        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(false);
    });

    it("should call update with tutor id and pet id on edit submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        await findButtonByIcon(wrapper, "edit")!.trigger("click");

        const payload = createPetPayload({ name: "Editado" });
        await wrapper.findComponent(PetFormDialog).vm.$emit("submit", payload);
        await flushPromises();

        expect(petUpdateMock).toHaveBeenCalledWith("tutor-1", "pet-1", payload);
        expect(petRegisterMock).not.toHaveBeenCalled();
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Pet atualizado com sucesso!",
            }),
        );
    });

    it("should refresh table after successful submit", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        petListMock.mockClear();

        await wrapper.findComponent(PetFormDialog).vm.$emit("submit", createPetPayload());
        await flushPromises();

        expect(petListMock).toHaveBeenCalledTimes(1);
    });

    it("should notify error and keep dialog open when submit fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(true);

        petRegisterMock.mockRejectedValueOnce(
            Object.assign(new Error("Erro ao salvar"), {
                data: { errorMessage: "Erro ao salvar" },
            }),
        );

        await wrapper.findComponent(PetFormDialog).vm.$emit("submit", createPetPayload());
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao salvar",
            }),
        );
        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(true);
    });

    it("should open delete dialog with pet name when delete is clicked", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        await findButtonByIcon(wrapper, "delete")!.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain("Rex");
    });

    it("should call remove with tutor id and pet id on delete confirm", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(petRemoveMock).toHaveBeenCalledWith("tutor-1", "pet-1");
        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "positive",
                message: "Pet excluído com sucesso!",
            }),
        );
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(false);
        expect(petListMock).toHaveBeenCalledTimes(2);
    });

    it("should notify error and keep delete dialog open when removal fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        petRemoveMock.mockRejectedValueOnce(
            Object.assign(new Error("Pet not found"), {
                data: { errorMessage: "Pet not found" },
            }),
        );

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Pet not found",
            }),
        );
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);
    });

    it("should not call remove when delete is confirmed without selection", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await wrapper.findComponent(ConfirmDialog).vm.$emit("confirm");
        await flushPromises();

        expect(petRemoveMock).not.toHaveBeenCalled();
    });

    it("should close delete dialog when it emits update:modelValue (cancel / ESC / backdrop)", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        await findButtonByIcon(wrapper, "delete")!.trigger("click");
        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(ConfirmDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(ConfirmDialog).props("modelValue")).toBe(false);
    });

    it("should notify error when loading tutors fails", async () => {
        setupContainer();
        tutorListMock.mockRejectedValue(new Error("Network Error"));

        mountPage();
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao carregar tutores.",
            }),
        );
    });

    it("should render mobile card with pet data when in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain("Rex");
        expect(cardText).toContain("Cão");
        expect(cardText).toContain("Vira Lata");
        expect(cardText).toContain("Macho");

        const cardEdit = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "edit")!;
        await cardEdit.trigger("click");

        const formDialog = wrapper.findComponent(PetFormDialog);
        expect(formDialog.props("modelValue")).toBe(true);
        expect(formDialog.props("pet")).toMatchObject({ id: "pet-1" });

        await wrapper.findComponent(PetFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        const cardDelete = wrapper
            .findAllComponents(QBtn)
            .find((b) => b.props("icon") === "delete")!;
        await cardDelete.trigger("click");

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props("modelValue")).toBe(true);
        expect(confirmDialog.props("message")).toContain("Rex");
    });

    it("should close form dialog when it emits update:modelValue (cancel / ESC / backdrop)", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        const newButton = wrapper.findAllComponents(QBtn).find((b) => b.props("icon") === "add")!;
        await newButton.trigger("click");
        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(true);

        await wrapper.findComponent(PetFormDialog).vm.$emit("update:modelValue", false);
        await flushPromises();

        expect(wrapper.findComponent(PetFormDialog).props("modelValue")).toBe(false);
    });

    it("should notify error when loading pets fails", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);

        petListMock.mockRejectedValue(new Error("Network Error"));

        await selectTutor(wrapper);
        await flushPromises();

        expect(notifyMock).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "negative",
                message: "Erro ao carregar pets.",
            }),
        );
    });

    it("should render fallbacks for unknown species and sex in table", async () => {
        setupContainer(
            createPaginatedPets({
                items: [
                    createMockPet({
                        id: "pet-x",
                        species: "UnknownSpecies" as Species,
                        sex: "UnknownSex" as PetSex,
                        breed: null,
                        weight: null,
                    }),
                ],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(wrapper.text()).toContain("UnknownSpecies");
        expect(wrapper.text()).toContain("UnknownSex");
        expect(wrapper.text()).toContain("—");
    });

    it("should render card fallbacks for unknown species and missing breed in mobile mode", async () => {
        screenState.lt.sm = true;
        setupContainer(
            createPaginatedPets({
                items: [
                    createMockPet({
                        id: "pet-x",
                        species: "UnknownSpecies" as Species,
                        breed: null,
                        weight: null,
                    }),
                ],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        expect(wrapper.find("thead").exists()).toBe(false);

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain("UnknownSpecies");
        expect(cardText).toContain("· —");
        expect(cardText).not.toContain("Vira Lata");
    });

    it("should cover fetcher fallback and tutor deselect", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();

        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);

        await selectTutor(wrapper);
        wrapper.findComponent(QSelect).vm.$emit("update:modelValue", null);
        await flushPromises();

        expect(wrapper.findComponent(EmptyState).exists()).toBe(true);
    });

    it("should not call update or register when submit happens without tutor selected", async () => {
        setupContainer();
        const wrapper = mountPage();
        await flushPromises();
        await wrapper.findComponent(PetFormDialog).vm.$emit("submit", createPetPayload());
        await flushPromises();

        expect(petRegisterMock).not.toHaveBeenCalled();
        expect(petUpdateMock).not.toHaveBeenCalled();
    });

    it("should hide birthDate line in mobile card when pet has no birth date", async () => {
        screenState.lt.sm = true;
        setupContainer(
            createPaginatedPets({
                items: [createMockPet({ birthDate: null })],
            }),
        );
        const wrapper = mountPage();
        await flushPromises();

        await selectTutor(wrapper);
        await flushPromises();

        const cardText = wrapper.find(".q-card").text();
        expect(cardText).toContain("Macho");
        expect(cardText).toContain("5 kg");
        expect(cardText).not.toContain("2020-05-10");
    });
});
