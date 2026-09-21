import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentMember: vi.fn(),
  memberUpdate: vi.fn(),
  auditCreate: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({
  requireCurrentMember: mocks.requireCurrentMember,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    member: { update: mocks.memberUpdate },
    auditLog: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));

import { updateOwnProfile } from "./actions";

describe("updateOwnProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentMember.mockResolvedValue({
      user: { id: "trusted-user" },
      member: { id: "trusted-member", slug: "ada" },
    });
    mocks.memberUpdate.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockResolvedValue([]);
  });

  it("derives ownership from the authenticated member and ignores injected IDs", async () => {
    const formData = new FormData();
    formData.set("fullName", "Ada Lovelace");
    formData.set("headline", "Engineer");
    formData.set("bio", "Builds thoughtful products.");
    formData.set("memberId", "another-member");
    formData.set("userId", "another-user");
    formData.set("role", "TEAM_ADMIN");

    const result = await updateOwnProfile(
      { status: "idle", message: "" },
      formData,
    );

    expect(result).toEqual({
      status: "success",
      message: "Draft profile saved.",
    });
    expect(mocks.memberUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trusted-member", userId: "trusted-user" },
        data: expect.not.objectContaining({
          memberId: expect.anything(),
          userId: expect.anything(),
          role: expect.anything(),
        }),
      }),
    );
  });

  it("does not write invalid publication requests", async () => {
    const formData = new FormData();
    formData.set("fullName", "Ada Lovelace");
    formData.set("isPublished", "on");

    const result = await updateOwnProfile(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toMatchObject({
      headline: ["Add a headline before publishing."],
      bio: ["Add a biography before publishing."],
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
