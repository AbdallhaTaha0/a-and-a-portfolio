import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  transaction: vi.fn(),
  projectFindUnique: vi.fn(),
  memberFindUnique: vi.fn(),
  assignmentFindUnique: vi.fn(),
  assignmentUpsert: vi.fn(),
  assignmentDelete: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
  checkAdminMutationLimit: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({ requireTeamAdmin: mocks.requireTeamAdmin }));
vi.mock("@/server/db/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/server/security/admin-rate-limit", () => ({ checkAdminMutationLimit: mocks.checkAdminMutationLimit }));

import { removeProjectMember, saveProjectMember } from "./project-member-actions";

const idle = { status: "idle" as const, message: "" };
function assignmentForm() {
  const formData = new FormData();
  formData.set("projectId", "project-1");
  formData.set("memberId", "member-1");
  formData.set("role", "Engineer");
  formData.set("contribution", "Built the application.");
  return formData;
}

describe("project member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkAdminMutationLimit.mockResolvedValue(null);
    mocks.requireTeamAdmin.mockResolvedValue({ id: "trusted-admin" });
    mocks.projectFindUnique.mockResolvedValue({ id: "trusted-project", slug: "project-slug" });
    mocks.memberFindUnique.mockResolvedValue({ id: "trusted-member" });
    mocks.assignmentFindUnique.mockResolvedValue(null);
    mocks.assignmentUpsert.mockResolvedValue({});
    mocks.assignmentDelete.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback: (transaction: unknown) => Promise<unknown>) => callback({
      project: { findUnique: mocks.projectFindUnique },
      member: { findUnique: mocks.memberFindUnique },
      projectMember: { findUnique: mocks.assignmentFindUnique, upsert: mocks.assignmentUpsert, delete: mocks.assignmentDelete },
      auditLog: { create: mocks.auditCreate },
    }));
  });

  it("rejects callers without administrator authorization", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(saveProjectMember(idle, assignmentForm())).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("re-reads both records before assigning a member", async () => {
    const formData = assignmentForm();
    formData.set("userId", "injected-user");
    const result = await saveProjectMember(idle, formData);

    expect(result.status).toBe("success");
    expect(mocks.projectFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "project-1" } }));
    expect(mocks.memberFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "member-1" } }));
    expect(mocks.assignmentUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ projectId: "trusted-project", memberId: "trusted-member" }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PROJECT_MEMBER_ASSIGNED", userId: "trusted-admin" }),
    }));
  });

  it("audits an existing assignment as an update", async () => {
    mocks.assignmentFindUnique.mockResolvedValueOnce({ projectId: "trusted-project" });
    await saveProjectMember(idle, assignmentForm());
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PROJECT_MEMBER_UPDATED" }),
    }));
  });

  it("does not mutate when either referenced record is missing", async () => {
    mocks.memberFindUnique.mockResolvedValueOnce(null);
    const result = await saveProjectMember(idle, assignmentForm());
    expect(result.status).toBe("error");
    expect(mocks.assignmentUpsert).not.toHaveBeenCalled();
  });

  it("re-reads, removes, audits, and revalidates an assignment", async () => {
    mocks.assignmentFindUnique.mockResolvedValueOnce({
      projectId: "trusted-project",
      memberId: "trusted-member",
      project: { slug: "project-slug" },
    });
    const result = await removeProjectMember(idle, assignmentForm());
    expect(result.status).toBe("success");
    expect(mocks.assignmentDelete).toHaveBeenCalledWith({
      where: { projectId_memberId: { projectId: "trusted-project", memberId: "trusted-member" } },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PROJECT_MEMBER_REMOVED" }),
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-slug");
  });
});
