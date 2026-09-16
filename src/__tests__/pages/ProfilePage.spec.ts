import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { Quasar } from "quasar";
import { defineComponent, nextTick, ref } from "vue";
import ProfilePage from "../../pages/ProfilePage.vue";
import UserForm from "../../components/profile/UserForm.vue";
import ClinicForm from "../../components/profile/ClinicForm.vue";
import type { User, UpdateAccountPayload } from "../../domain/models/Auth";
import { createMockUser, createMockClinic } from "../../test/factories/authFactory";

const updateAccountMock = vi
    .fn<(payload: UpdateAccountPayload) => Promise<void>>()
    .mockResolvedValue(undefined);
const userState = ref<User | null>(null);

vi.mock("@/stores/auth", () => ({
    useAuthStore: () => ({
        get user() {
            return userState.value;
        },
        get userRole() {
            return userState.value?.role ?? null;
        },
        updateAccount: updateAccountMock,
    }),
}));

const SlotStub = defineComponent({
    name: "SlotStub",
    setup(_, { slots }) {
        return () => slots.default?.();
    },
});

let notifySpy = vi.fn<(opts: Record<string, unknown>) => void>();

const mountPage = () => {
    const wrapper = mount(ProfilePage, {
        global: {
            plugins: [Quasar],
            stubs: {
                QPage: SlotStub,
                QExpansionItem: SlotStub,
            },
        },
    });

    const $q = (
        wrapper.vm.$.appContext.config.globalProperties as unknown as {
            $q: { notify: unknown };
        }
    ).$q;
    notifySpy = vi.fn<(opts: Record<string, unknown>) => void>();
    $q.notify = notifySpy;

    return wrapper;
};

const submitFrom = async (
    wrapper: VueWrapper,
    component: typeof UserForm | typeof ClinicForm,
    payload: Partial<UpdateAccountPayload> = {},
) => {
    wrapper.findComponent(component).vm.$emit("submit", payload);
    await flushPromises();
};

describe("ProfilePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        updateAccountMock.mockResolvedValue(undefined);
        userState.value = null;
    });

    it("should render UserForm and ClinicForm for admin role", () => {
        userState.value = createMockUser({ role: "Admin", clinic: createMockClinic() });
        const wrapper = mountPage();

        expect(wrapper.findComponent(UserForm).exists()).toBe(true);
        expect(wrapper.findComponent(ClinicForm).exists()).toBe(true);
    });

    it("should render only UserForm for non-admin role", () => {
        userState.value = createMockUser({ role: "User" });
        const wrapper = mountPage();

        expect(wrapper.findComponent(UserForm).exists()).toBe(true);
        expect(wrapper.findComponent(ClinicForm).exists()).toBe(false);
    });

    it("should merge user form data with prefilled clinic data on user submit", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        const wrapper = mountPage();

        await submitFrom(wrapper, UserForm, { userName: "Novo Nome" });

        expect(updateAccountMock).toHaveBeenCalledTimes(1);
        const payload = updateAccountMock.mock.calls[0][0];
        expect(payload.userName).toBe("Novo Nome");
        expect(payload.userPhoneNumber).toBe("11999998888");
        expect(payload.clinicTradeName).toBe("Pet Clinix");
        expect(payload.clinicCity).toBe("Sao Paulo");
    });

    it("should merge clinic form data with prefilled user data on clinic submit", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        const wrapper = mountPage();

        await submitFrom(wrapper, ClinicForm, { clinicTradeName: "Nova Clinica" });

        const payload = updateAccountMock.mock.calls[0][0];
        expect(payload.clinicTradeName).toBe("Nova Clinica");
        expect(payload.userName).toBe("John Doe");
        expect(payload.userBirthDate).toBe("1990-01-01");
    });

    it("should show positive notification on user update success", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        mountPage();

        await submitFrom(mountPage(), UserForm, { userName: "Novo Nome" });

        expect(notifySpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: "positive", message: "Dados pessoais atualizados!" }),
        );
    });

    it("should show positive notification on clinic update success", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        const wrapper = mountPage();

        await submitFrom(wrapper, ClinicForm, { clinicTradeName: "Nova Clinica" });

        expect(notifySpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: "positive", message: "Dados da clínica atualizados!" }),
        );
    });

    it("should show negative notification and stop loading when user update fails", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        updateAccountMock.mockRejectedValueOnce(new Error("fail"));
        const wrapper = mountPage();

        await submitFrom(wrapper, UserForm, { userName: "Novo Nome" });

        expect(notifySpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: "negative", message: "Erro ao atualizar dados." }),
        );
        expect(wrapper.findComponent(UserForm).props("isLoading")).toBe(false);
    });

    it("should show negative notification and stop loading when clinic update fails", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        updateAccountMock.mockRejectedValueOnce(new Error("fail"));
        const wrapper = mountPage();

        await submitFrom(wrapper, ClinicForm, { clinicTradeName: "Nova Clinica" });

        expect(notifySpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: "negative", message: "Erro ao atualizar clínica." }),
        );
        expect(wrapper.findComponent(ClinicForm).props("isLoading")).toBe(false);
    });

    it("should show loading state only on the form being submitted", async () => {
        userState.value = createMockUser({ clinic: createMockClinic() });
        const wrapper = mountPage();

        let resolveUpdate!: (value: void) => void;
        updateAccountMock.mockReturnValueOnce(
            new Promise<void>((resolve) => (resolveUpdate = resolve)),
        );

        wrapper.findComponent(UserForm).vm.$emit("submit", { userName: "X" });
        await flushPromises();

        expect(wrapper.findComponent(UserForm).props("isLoading")).toBe(true);
        expect(wrapper.findComponent(ClinicForm).props("isLoading")).toBe(false);

        resolveUpdate();
        await flushPromises();

        expect(wrapper.findComponent(UserForm).props("isLoading")).toBe(false);
    });

    it("should send payload without clinic fields when user has no clinic", async () => {
        userState.value = createMockUser();
        const wrapper = mountPage();

        await submitFrom(wrapper, UserForm, { userName: "Novo Nome" });

        const payload = updateAccountMock.mock.calls[0][0];
        expect(payload.userName).toBe("Novo Nome");
        expect(payload.clinicTradeName).toBeUndefined();
    });

    it("should refill payload when user changes after mount", async () => {
        const wrapper = mountPage();

        userState.value = createMockUser({ clinic: createMockClinic() });
        await nextTick();
        await flushPromises();

        await submitFrom(wrapper, UserForm, {});

        const payload = updateAccountMock.mock.calls[0][0];
        expect(payload.userName).toBe("John Doe");
        expect(payload.clinicTradeName).toBe("Pet Clinix");
    });

    it("should fall back to empty strings when user and clinic fields are missing", async () => {
        userState.value = createMockUser({
            name: undefined,
            phoneNumber: undefined,
            birthDate: undefined,
            clinic: {} as User["clinic"],
        });
        const wrapper = mountPage();

        await submitFrom(wrapper, UserForm, {});

        const payload = updateAccountMock.mock.calls[0][0];
        expect(payload.userName).toBe("");
        expect(payload.userPhoneNumber).toBe("");
        expect(payload.userBirthDate).toBe("");
        expect(payload.clinicTradeName).toBe("");
        expect(payload.clinicEmail).toBe("");
        expect(payload.clinicState).toBe("");
    });
});
