import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStaffLimit } from "../../composables/useStaffLimit";
import type { StaffLimit } from "../../domain/models/StaffLimit";
import { createStaffLimit } from "../../test/factories/staffFactory";

vi.mock("@/infrastructure/container", () => ({
    container: {
        resolve: vi.fn<(key: string) => unknown>(),
    },
}));

import { container } from "../../infrastructure/container";

const getStaffLimitMock = vi.fn<() => Promise<StaffLimit>>();

const setupContainer = () => {
    vi.mocked(container.resolve).mockReturnValue({
        getStaffLimit: getStaffLimitMock,
    });
};

describe("useStaffLimit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getStaffLimitMock.mockReset();
        useStaffLimit().staffLimit.value = null;
    });

    it("should start with null staff limit", () => {
        setupContainer();

        const { staffLimit } = useStaffLimit();

        expect(staffLimit.value).toBeNull();
    });

    it("should load staff limit from the service", async () => {
        setupContainer();
        const staffLimit = createStaffLimit();
        getStaffLimitMock.mockResolvedValue(staffLimit);

        const { staffLimit: state, load } = useStaffLimit();

        await load();

        expect(getStaffLimitMock).toHaveBeenCalledWith();
        expect(state.value).toEqual(staffLimit);
    });

    it("should load staff limit without maximum when plan is unlimited", async () => {
        setupContainer();
        const unlimited = createStaffLimit({ limit: null });
        getStaffLimitMock.mockResolvedValue(unlimited);

        const { staffLimit, load } = useStaffLimit();

        await load();

        expect(staffLimit.value).toEqual(unlimited);
        expect(staffLimit.value?.limit).toBeNull();
    });

    it("should reset staff limit to null when loading fails", async () => {
        setupContainer();
        getStaffLimitMock.mockRejectedValue(new Error("Network Error"));

        const { staffLimit, load } = useStaffLimit();
        staffLimit.value = createStaffLimit();

        await load();

        expect(staffLimit.value).toBeNull();
    });
});
