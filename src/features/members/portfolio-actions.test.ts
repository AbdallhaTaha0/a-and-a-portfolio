import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentMember: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  certificationUpdateMany: vi.fn(),
  achievementUpdateMany: vi.fn(),
  projectUpdateMany: vi.fn(),
  projectFindFirst: vi.fn(),
  linkUpdateMany: vi.fn(),
  skillUpdateMany: vi.fn(),
  linkAggregate: vi.fn(),
  linkCreate: vi.fn(),
  linkDeleteMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({
  requireCurrentMember: mocks.requireCurrentMember,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));

import {
  createPortfolioEntry,
  deletePortfolioEntry,
  updatePortfolioEntry,
} from "./portfolio-actions";

function validForm(kind: string) {
  const form = new FormData();
  if (kind === "skills") form.set("proficiency", "80");
  if (kind === "certifications") {
    form.set("name", "Cloud Professional");
    form.set("issuer", "Example Institute");
    form.set("issueDate", "2026-01-01");
  }
  if (kind === "achievements") {
    form.set("title", "Community Award");
    form.set("description", "Recognized for community impact.");
  }
  if (kind === "projects") {
    form.set("title", "Portfolio");
    form.set("slug", "portfolio");
  }
  if (kind === "links") {
    form.set("platform", "GitHub");
    form.set("url", "https://github.com/example");
  }
  form.set("memberId", "attacker-controlled-member");
  return form;
}

describe("member portfolio ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentMember.mockResolvedValue({
      user: { id: "trusted-user" },
      member: { id: "trusted-member", slug: "ada" },
    });
    for (const update of [
      mocks.skillUpdateMany,
      mocks.certificationUpdateMany,
      mocks.achievementUpdateMany,
      mocks.projectUpdateMany,
      mocks.linkUpdateMany,
    ]) {
      update.mockResolvedValue({ count: 1 });
    }
    mocks.linkDeleteMany.mockResolvedValue({ count: 1 });
    mocks.projectFindFirst.mockResolvedValue({ thumbnailUrl: null });
    mocks.linkAggregate.mockResolvedValue({ _max: { sortOrder: null } });
    mocks.linkCreate.mockResolvedValue({ id: "new-link" });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          memberSkill: {
            updateMany: mocks.skillUpdateMany,
          },
          certification: { updateMany: mocks.certificationUpdateMany },
          achievement: { updateMany: mocks.achievementUpdateMany },
          personalProject: {
            findFirst: mocks.projectFindFirst,
            updateMany: mocks.projectUpdateMany,
          },
          socialLink: {
            aggregate: mocks.linkAggregate,
            create: mocks.linkCreate,
            updateMany: mocks.linkUpdateMany,
            deleteMany: mocks.linkDeleteMany,
          },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("derives ownership for new entries from the authenticated session", async () => {
    const result = await createPortfolioEntry(
      "links",
      { status: "idle", message: "" },
      validForm("links"),
    );

    expect(result.status).toBe("success");
    expect(mocks.linkCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "trusted-member",
          platform: "GitHub",
        }),
      }),
    );
  });

  it.each([
    ["skills", mocks.skillUpdateMany, { memberId: "trusted-member", skillId: "entry-1" }],
    [
      "certifications",
      mocks.certificationUpdateMany,
      { id: "entry-1", memberId: "trusted-member" },
    ],
    ["achievements", mocks.achievementUpdateMany, { id: "entry-1", memberId: "trusted-member" }],
    ["projects", mocks.projectUpdateMany, { id: "entry-1", memberId: "trusted-member" }],
    ["links", mocks.linkUpdateMany, { id: "entry-1", memberId: "trusted-member" }],
  ] as const)("constrains %s updates to the authenticated member", async (kind, update, where) => {
    const result = await updatePortfolioEntry(
      kind,
      "entry-1",
      { status: "idle", message: "" },
      validForm(kind),
    );

    expect(result.status).toBe("success");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where }));
  });

  it("does not audit a cross-member deletion", async () => {
    mocks.linkDeleteMany.mockResolvedValue({ count: 0 });
    const result = await deletePortfolioEntry(
      "links",
      "another-members-link",
      { status: "idle", message: "" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "That entry is no longer available.",
    });
    expect(mocks.linkDeleteMany).toHaveBeenCalledWith({
      where: { id: "another-members-link", memberId: "trusted-member" },
    });
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
