import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  transaction: vi.fn(),
  memberAggregate: vi.fn(),
  memberCreate: vi.fn(),
  userCreate: vi.fn(),
  userFindUnique: vi.fn(),
  userCount: vi.fn(),
  userUpdate: vi.fn(),
  sessionDeleteMany: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({
  requireTeamAdmin: mocks.requireTeamAdmin,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  createOwnMemberProfile,
  changeAccountRole,
  changeAccountStatus,
  inviteAdministratorAccount,
  inviteMemberAccount,
} from "./account-actions";

describe("team account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeamAdmin.mockResolvedValue({
      id: "trusted-admin",
      email: "admin@example.com",
      name: "Admin",
      member: null,
    });
    mocks.memberAggregate.mockResolvedValue({ _max: { teamOrder: 2 } });
    mocks.memberCreate.mockResolvedValue({ id: "new-profile" });
    mocks.userCreate.mockResolvedValue({
      id: "new-user",
      member: { id: "new-profile" },
    });
    mocks.userFindUnique.mockResolvedValue({
      role: "TEAM_ADMIN",
      isActive: true,
      member: { id: "existing-profile" },
    });
    mocks.userCount.mockResolvedValue(2);
    mocks.userUpdate.mockResolvedValue({});
    mocks.sessionDeleteMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          member: {
            aggregate: mocks.memberAggregate,
            create: mocks.memberCreate,
          },
          user: {
            create: mocks.userCreate,
            findUnique: mocks.userFindUnique,
            count: mocks.userCount,
            update: mocks.userUpdate,
          },
          session: { deleteMany: mocks.sessionDeleteMany },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("links an administrator's own profile to the authenticated account", async () => {
    const formData = new FormData();
    formData.set("fullName", "Admin Person");
    formData.set("slug", "admin-person");
    formData.set("userId", "another-user");

    const result = await createOwnMemberProfile(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.memberCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "trusted-admin" }),
      }),
    );
  });

  it("creates invited members with a server-controlled MEMBER role", async () => {
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("fullName", "Team Member");
    formData.set("slug", "team-member");
    formData.set("role", "TEAM_ADMIN");

    const result = await inviteMemberAccount(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "MEMBER" }),
      }),
    );
  });

  it("creates and audits additional administrator accounts", async () => {
    const formData = new FormData();
    formData.set("email", "second-admin@example.com");
    formData.set("name", "Second Admin");

    const result = await inviteAdministratorAccount(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.userCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "TEAM_ADMIN" }),
      }),
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "trusted-admin",
          action: "TEAM_ADMIN_INVITED",
        }),
      }),
    );
  });

  it("atomically refuses to deactivate the final active administrator", async () => {
    mocks.userCount.mockResolvedValue(1);
    const formData = new FormData();
    formData.set("userId", "final-admin");
    formData.set("isActive", "false");

    const result = await changeAccountStatus(
      { status: "idle", message: "" },
      formData,
    );

    expect(result).toEqual({
      status: "error",
      message: "The final active administrator cannot be deactivated.",
    });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.sessionDeleteMany).not.toHaveBeenCalled();
  });

  it("demotes an administrator without deleting their Member profile", async () => {
    const formData = new FormData();
    formData.set("userId", "target-admin");
    formData.set("role", "MEMBER");

    const result = await changeAccountRole(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "target-admin" },
      data: { role: "MEMBER" },
    });
    expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "target-admin" },
    });
    expect(mocks.memberCreate).not.toHaveBeenCalled();
  });
});
