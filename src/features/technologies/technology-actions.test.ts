import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(), transaction: vi.fn(), technologyCreate: vi.fn(), technologyFindUnique: vi.fn(), technologyUpdate: vi.fn(), technologyDelete: vi.fn(),
  projectFindUnique: vi.fn(), projectTechnologyFindUnique: vi.fn(), projectTechnologyUpsert: vi.fn(), projectTechnologyDelete: vi.fn(), auditCreate: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({ requireTeamAdmin: mocks.requireTeamAdmin }));
vi.mock("@/server/db/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));

import { assignProjectTechnology, createTechnology, deleteTechnology, removeProjectTechnology, updateTechnology } from "./technology-actions";
const idle = { status: "idle" as const, message: "" };
const technologyForm = () => { const data = new FormData(); data.set("name", "React"); return data; };
const relationForm = () => { const data = new FormData(); data.set("projectId", "project-1"); data.set("technologyId", "tech-1"); return data; };

describe("technology actions", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.requireTeamAdmin.mockResolvedValue({ id: "trusted-admin" }); mocks.technologyCreate.mockResolvedValue({ id: "trusted-tech" });
    mocks.technologyFindUnique.mockResolvedValue({ id: "trusted-tech", name: "React", _count: { projects: 0 } }); mocks.technologyUpdate.mockResolvedValue({}); mocks.technologyDelete.mockResolvedValue({});
    mocks.projectFindUnique.mockResolvedValue({ id: "trusted-project", slug: "project-slug" }); mocks.projectTechnologyUpsert.mockResolvedValue({}); mocks.projectTechnologyDelete.mockResolvedValue({}); mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({ technology: { create: mocks.technologyCreate, findUnique: mocks.technologyFindUnique, update: mocks.technologyUpdate, delete: mocks.technologyDelete }, project: { findUnique: mocks.projectFindUnique }, projectTechnology: { findUnique: mocks.projectTechnologyFindUnique, upsert: mocks.projectTechnologyUpsert, delete: mocks.projectTechnologyDelete }, auditLog: { create: mocks.auditCreate } }));
  });
  it("requires TEAM_ADMIN authorization", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(createTechnology(idle, technologyForm())).rejects.toThrow("Forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("creates a technology with allowlisted data and an audit record", async () => {
    const data = technologyForm(); data.set("projectId", "injected");
    expect((await createTechnology(idle, data)).status).toBe("success");
    expect(mocks.technologyCreate).toHaveBeenCalledWith({ data: { name: "React", category: null, iconUrl: null }, select: { id: true } });
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "TECHNOLOGY_CREATED" }) }));
  });
  it("re-reads the trusted technology before updating", async () => {
    const data = technologyForm(); data.set("technologyId", "tech-1");
    expect((await updateTechnology(idle, data)).status).toBe("success");
    expect(mocks.technologyFindUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "tech-1" } }));
    expect(mocks.technologyUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "trusted-tech" } }));
  });
  it("refuses to delete a technology still assigned to projects", async () => {
    mocks.technologyFindUnique.mockResolvedValueOnce({ id: "trusted-tech", name: "React", _count: { projects: 2 } });
    const data = new FormData(); data.set("technologyId", "tech-1"); data.set("confirmation", "React");
    const result = await deleteTechnology(idle, data);
    expect(result.message).toContain("Remove this technology"); expect(mocks.technologyDelete).not.toHaveBeenCalled();
  });
  it("re-reads both records and assigns a project technology", async () => {
    expect((await assignProjectTechnology(idle, relationForm())).status).toBe("success");
    expect(mocks.projectTechnologyUpsert).toHaveBeenCalledWith(expect.objectContaining({ create: { projectId: "trusted-project", technologyId: "trusted-tech" } }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: "PROJECT_TECHNOLOGY_ASSIGNED" }) }));
  });
  it("re-reads and removes the exact project technology relationship", async () => {
    mocks.projectTechnologyFindUnique.mockResolvedValueOnce({ projectId: "trusted-project", technologyId: "trusted-tech", project: { slug: "project-slug" } });
    expect((await removeProjectTechnology(idle, relationForm())).status).toBe("success");
    expect(mocks.projectTechnologyDelete).toHaveBeenCalledWith({ where: { projectId_technologyId: { projectId: "trusted-project", technologyId: "trusted-tech" } } });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/projects/project-slug");
  });
});
