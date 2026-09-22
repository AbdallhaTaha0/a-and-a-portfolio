import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  transaction: vi.fn(),
  projectCreate: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  projectDelete: vi.fn(),
  auditCreate: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  checkAdminMutationLimit: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/auth/current-user", () => ({ requireTeamAdmin: mocks.requireTeamAdmin }));
vi.mock("@/server/db/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/server/security/admin-rate-limit", () => ({ checkAdminMutationLimit: mocks.checkAdminMutationLimit }));

import { createProject, deleteProject, updateProject } from "./project-actions";

const idle = { status: "idle" as const, message: "" };

function projectForm(includeId = false) {
  const formData = new FormData();
  if (includeId) formData.set("projectId", "project-1");
  formData.set("title", "Portfolio Platform");
  formData.set("slug", "portfolio-platform");
  formData.set("status", "PLANNING");
  formData.set("sortOrder", "0");
  return formData;
}

describe("administrator project actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkAdminMutationLimit.mockResolvedValue(null);
    mocks.requireTeamAdmin.mockResolvedValue({ id: "trusted-admin" });
    mocks.projectCreate.mockResolvedValue({ id: "new-project" });
    mocks.projectFindUnique.mockResolvedValue({
      id: "trusted-project",
      slug: "old-slug",
      thumbnailUrl: null,
      images: [],
    });
    mocks.projectUpdate.mockResolvedValue({});
    mocks.projectDelete.mockResolvedValue({});
    mocks.auditCreate.mockResolvedValue({});
    mocks.redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    mocks.transaction.mockImplementation(async (callback: (transaction: unknown) => Promise<unknown>) => callback({
      project: { create: mocks.projectCreate, findUnique: mocks.projectFindUnique, update: mocks.projectUpdate, delete: mocks.projectDelete },
      auditLog: { create: mocks.auditCreate },
    }));
  });

  it("blocks project deletion before its transaction when rate limited", async () => {
    mocks.checkAdminMutationLimit.mockResolvedValueOnce("Too many sensitive changes were attempted recently. Please try again later.");
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("confirmation", "old-slug");

    const result = await deleteProject(idle, formData);

    expect(result.status).toBe("error");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated or unauthorized project creation", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(createProject(idle, projectForm())).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("creates and audits a server-controlled project record", async () => {
    const formData = projectForm();
    formData.set("memberId", "injected-member");
    const result = await createProject(idle, formData);

    expect(result.status).toBe("success");
    expect(mocks.projectCreate).toHaveBeenCalledWith({
      data: expect.not.objectContaining({ memberId: expect.anything() }),
      select: { id: true },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "trusted-admin", action: "PROJECT_CREATED", entityId: "new-project" }),
    }));
  });

  it("re-reads the trusted project before updating it", async () => {
    const formData = projectForm(true);
    formData.set("slug", "new-slug");
    const result = await updateProject(idle, formData);

    expect(result.status).toBe("success");
    expect(mocks.projectFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "project-1" } }));
    expect(mocks.projectUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "trusted-project" } }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/old-slug");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/new-slug");
  });

  it("does not write invalid publication changes", async () => {
    const formData = projectForm(true);
    formData.set("isPublished", "on");
    const result = await updateProject(idle, formData);

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("description");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires the current trusted slug before deletion", async () => {
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("confirmation", "stale-slug");
    const result = await deleteProject(idle, formData);

    expect(result.status).toBe("error");
    expect(mocks.projectDelete).not.toHaveBeenCalled();
  });

  it("deletes atomically, audits, revalidates, and redirects", async () => {
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("confirmation", "old-slug");

    await expect(deleteProject(idle, formData)).rejects.toThrow("NEXT_REDIRECT");
    expect(mocks.projectDelete).toHaveBeenCalledWith({ where: { id: "trusted-project" } });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "PROJECT_DELETED", entityId: "trusted-project" }),
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/old-slug");
    expect(mocks.redirect).toHaveBeenCalledWith("/admin/projects?projectDeleted=1");
  });
});
