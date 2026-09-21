import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentMember: vi.fn(),
  revalidatePath: vi.fn(),
  transaction: vi.fn(),
  educationUpdateMany: vi.fn(),
  educationDeleteMany: vi.fn(),
  experienceUpdateMany: vi.fn(),
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
  deleteEducation,
  updateEducation,
  updateExperience,
} from "./timeline-actions";

describe("member timeline ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireCurrentMember.mockResolvedValue({
      user: { id: "trusted-user" },
      member: { id: "trusted-member", slug: "ada" },
    });
    mocks.educationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.educationDeleteMany.mockResolvedValue({ count: 1 });
    mocks.experienceUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          education: {
            updateMany: mocks.educationUpdateMany,
            deleteMany: mocks.educationDeleteMany,
          },
          experience: { updateMany: mocks.experienceUpdateMany },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("constrains education updates by the authenticated member", async () => {
    const formData = new FormData();
    formData.set("institution", "Cairo University");
    formData.set("degree", "Bachelor of Science");
    formData.set("fieldOfStudy", "Computer Science");
    formData.set("startDate", "2020-09-01");
    formData.set("memberId", "another-member");

    const result = await updateEducation(
      "target-record",
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.educationUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "target-record", memberId: "trusted-member" },
      }),
    );
  });

  it("constrains experience updates by the authenticated member", async () => {
    const formData = new FormData();
    formData.set("company", "A&A");
    formData.set("position", "Engineer");
    formData.set("startDate", "2024-01-01");

    const result = await updateExperience(
      "target-record",
      { status: "idle", message: "" },
      formData,
    );

    expect(result.status).toBe("success");
    expect(mocks.experienceUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "target-record", memberId: "trusted-member" },
      }),
    );
  });

  it("returns a safe error and skips auditing when a delete target is not owned", async () => {
    mocks.educationDeleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteEducation(
      "another-members-record",
      { status: "idle", message: "" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "That education entry is no longer available.",
    });
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
