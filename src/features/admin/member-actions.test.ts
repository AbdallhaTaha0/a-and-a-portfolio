import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  transaction: vi.fn(),
  memberFindUnique: vi.fn(),
  memberUpdate: vi.fn(),
  memberDelete: vi.fn(),
  userDelete: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/auth/current-user", () => ({
  requireTeamAdmin: mocks.requireTeamAdmin,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  deleteMemberProfileAsAdmin,
  updateMemberAsAdmin,
} from "./member-actions";

const idleState = { status: "idle" as const, message: "" };

function updateForm() {
  const formData = new FormData();
  formData.set("memberId", "member-1");
  formData.set("slug", "new-slug");
  formData.set("teamOrder", "2");
  formData.set("fullName", "Ada Lovelace");
  formData.set("headline", "Engineer");
  formData.set("bio", "Builds thoughtful products.");
  return formData;
}

function deleteForm(confirmation = "old-slug") {
  const formData = new FormData();
  formData.set("memberId", "member-1");
  formData.set("confirmation", confirmation);
  return formData;
}

describe("administrator Member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeamAdmin.mockResolvedValue({ id: "trusted-admin" });
    mocks.memberFindUnique.mockResolvedValue({
      id: "trusted-member",
      slug: "old-slug",
      user: { id: "owner-user", role: "MEMBER", isActive: false },
    });
    mocks.memberUpdate.mockResolvedValue({});
    mocks.memberDelete.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.redirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          member: {
            findUnique: mocks.memberFindUnique,
            update: mocks.memberUpdate,
            delete: mocks.memberDelete,
          },
          user: { delete: mocks.userDelete },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("rejects callers who are not authorized administrators", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("Forbidden"));

    await expect(updateMemberAsAdmin(idleState, updateForm())).rejects.toThrow(
      "Forbidden",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("re-reads the trusted target and cannot reassign ownership", async () => {
    const formData = updateForm();
    formData.set("userId", "attacker-selected-user");
    formData.set("role", "TEAM_ADMIN");

    const result = await updateMemberAsAdmin(idleState, formData);

    expect(result.status).toBe("success");
    expect(mocks.memberFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "member-1" } }),
    );
    expect(mocks.memberUpdate).toHaveBeenCalledWith({
      where: { id: "trusted-member" },
      data: expect.not.objectContaining({
        userId: expect.anything(),
        role: expect.anything(),
      }),
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "trusted-admin",
          action: "MEMBER_PROFILE_UPDATED_BY_ADMIN",
          entityId: "trusted-member",
        }),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/members/old-slug");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/members/new-slug");
  });

  it("does not write invalid publication changes", async () => {
    const formData = updateForm();
    formData.set("headline", "");
    formData.set("bio", "");
    formData.set("isPublished", "on");

    const result = await updateMemberAsAdmin(idleState, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toMatchObject({
      headline: ["Add a headline before publishing."],
      bio: ["Add a biography before publishing."],
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires the current trusted slug for deletion", async () => {
    const result = await deleteMemberProfileAsAdmin(
      idleState,
      deleteForm("stale-slug"),
    );

    expect(result.status).toBe("error");
    expect(mocks.memberDelete).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("requires active MEMBER accounts to be deactivated separately", async () => {
    mocks.memberFindUnique.mockResolvedValueOnce({
      id: "trusted-member",
      slug: "old-slug",
      user: { id: "owner-user", role: "MEMBER", isActive: true },
    });

    const result = await deleteMemberProfileAsAdmin(idleState, deleteForm());

    expect(result).toMatchObject({ status: "error" });
    expect(result.message).toContain("Deactivate this MEMBER account");
    expect(mocks.memberDelete).not.toHaveBeenCalled();
  });

  it("deletes only the Member profile and preserves audit history", async () => {
    await expect(
      deleteMemberProfileAsAdmin(idleState, deleteForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.memberDelete).toHaveBeenCalledWith({
      where: { id: "trusted-member" },
    });
    expect(mocks.userDelete).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "MEMBER_PROFILE_DELETED",
          entityId: "trusted-member",
          metadata: expect.objectContaining({ ownerAccountRetained: true }),
        }),
      }),
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/members?profileDeleted=1");
  });

  it("preserves the final active administrator account when removing its optional profile", async () => {
    mocks.memberFindUnique.mockResolvedValueOnce({
      id: "trusted-member",
      slug: "old-slug",
      user: { id: "final-admin", role: "TEAM_ADMIN", isActive: true },
    });

    await expect(
      deleteMemberProfileAsAdmin(idleState, deleteForm()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.memberDelete).toHaveBeenCalledOnce();
    expect(mocks.userDelete).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            ownerUserId: "final-admin",
            ownerAccountRetained: true,
          }),
        }),
      }),
    );
  });
});
