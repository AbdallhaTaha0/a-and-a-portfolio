import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { updateOwnAccountSettings } from "./account-settings-actions";

describe("updateOwnAccountSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentUser.mockResolvedValue({ id: "trusted-user" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          user: { updateMany: mocks.updateMany },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("updates only the allowlisted display name for the current active user", async () => {
    const form = new FormData();
    form.set("name", "Ada Lovelace");
    form.set("email", "attacker@example.com");
    form.set("role", "TEAM_ADMIN");
    form.set("isActive", "false");

    const result = await updateOwnAccountSettings(
      { status: "idle", message: "" },
      form,
    );

    expect(result.status).toBe("success");
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "trusted-user", isActive: true },
      data: { name: "Ada Lovelace" },
    });
  });

  it("does not write an audit event when the active account disappears", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const form = new FormData();
    form.set("name", "Ada Lovelace");

    const result = await updateOwnAccountSettings(
      { status: "idle", message: "" },
      form,
    );

    expect(result).toEqual({
      status: "error",
      message: "Your active account could not be found.",
    });
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
