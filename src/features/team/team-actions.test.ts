import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  transaction: vi.fn(),
  teamUpsert: vi.fn(),
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

import { updateTeamContent } from "./team-actions";

describe("team content action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeamAdmin.mockResolvedValue({ id: "trusted-admin" });
    mocks.teamUpsert.mockResolvedValue({ id: "primary-team" });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          team: { upsert: mocks.teamUpsert },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("authorizes, saves, audits, and revalidates team content", async () => {
    const formData = new FormData();
    formData.set("name", "A&A Studio");
    formData.set("shortDescription", "Design and engineering together.");
    formData.set("contactEmail", "hello@example.com");
    formData.set("githubUrl", "https://github.com/example");

    const result = await updateTeamContent(
      { status: "idle", message: "" },
      formData,
    );

    expect(mocks.requireTeamAdmin).toHaveBeenCalledOnce();
    expect(mocks.teamUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "a-and-a" },
        update: expect.objectContaining({ name: "A&A Studio" }),
      }),
    );
    expect(mocks.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "trusted-admin",
          action: "TEAM_CONTENT_UPDATED",
          entityType: "Team",
          entityId: "primary-team",
        }),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/team");
    expect(result.status).toBe("success");
  });

  it("does not write invalid content", async () => {
    const formData = new FormData();
    formData.set("name", "A");
    formData.set("githubUrl", "http://github.com/example");

    const result = await updateTeamContent(
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.name).toBeDefined();
    expect(result.fieldErrors?.githubUrl).toBeDefined();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not write when the requester is not a team administrator", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("Forbidden"));
    const formData = new FormData();
    formData.set("name", "A&A Studio");

    await expect(
      updateTeamContent({ status: "idle", message: "" }, formData),
    ).rejects.toThrow("Forbidden");

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
