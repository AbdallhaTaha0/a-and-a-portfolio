import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCurrentMember: vi.fn(),
  requireTeamAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  validateImageFile: vi.fn(),
  uploadImage: vi.fn(),
  deleteUploadedBlob: vi.fn(),
  deleteMediaIfUnreferenced: vi.fn(),
  consumeRateLimit: vi.fn(),
  checkAdminMutationLimit: vi.fn(),
  personalFindFirst: vi.fn(),
  transaction: vi.fn(),
  mediaCreate: vi.fn(),
  personalUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/auth/current-user", () => ({
  requireCurrentMember: mocks.requireCurrentMember,
  requireTeamAdmin: mocks.requireTeamAdmin,
}));
vi.mock("@/server/media/storage", () => ({
  validateImageFile: mocks.validateImageFile,
  uploadImage: mocks.uploadImage,
  deleteUploadedBlob: mocks.deleteUploadedBlob,
  deleteMediaIfUnreferenced: mocks.deleteMediaIfUnreferenced,
}));
vi.mock("@/server/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));
vi.mock("@/server/security/admin-rate-limit", () => ({
  checkAdminMutationLimit: mocks.checkAdminMutationLimit,
}));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    personalProject: { findFirst: mocks.personalFindFirst },
    project: { findUnique: vi.fn() },
    $transaction: mocks.transaction,
  },
}));

import { uploadMedia } from "./media-actions";

function uploadForm() {
  const form = new FormData();
  form.set("target", "personal-project-thumbnail");
  form.set("recordId", "project-1");
  form.set("memberId", "attacker-member");
  form.set("file", new File([new Uint8Array([0xff, 0xd8, 0xff])], "image.jpg", { type: "image/jpeg" }));
  return form;
}

describe("uploadMedia authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkAdminMutationLimit.mockResolvedValue(null);
    mocks.requireCurrentMember.mockResolvedValue({
      user: { id: "trusted-user" },
      member: { id: "trusted-member", slug: "ada" },
    });
    mocks.personalFindFirst.mockResolvedValue({ id: "project-1", thumbnailUrl: null });
    mocks.validateImageFile.mockResolvedValue({ success: true, extension: "jpg" });
    mocks.consumeRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      retryAfterSeconds: 600,
    });
    mocks.uploadImage.mockResolvedValue({
      url: "https://blob.example/image.jpg",
      storageKey: "personal-projects/project-1/image.jpg",
      filename: "image.jpg",
      mimeType: "image/jpeg",
      size: 3,
    });
    mocks.mediaCreate.mockResolvedValue({ id: "media-1" });
    mocks.personalUpdateMany.mockResolvedValue({ count: 1 });
    mocks.auditCreate.mockResolvedValue({});
    mocks.transaction.mockImplementation(
      async (callback: (transaction: unknown) => Promise<unknown>) =>
        callback({
          media: { create: mocks.mediaCreate },
          personalProject: { updateMany: mocks.personalUpdateMany },
          auditLog: { create: mocks.auditCreate },
        }),
    );
  });

  it("checks ownership before upload and attaches using trusted session ownership", async () => {
    const result = await uploadMedia({ status: "idle", message: "" }, uploadForm());

    expect(result.status).toBe("success");
    expect(mocks.personalFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-1", memberId: "trusted-member" },
      }),
    );
    expect(mocks.personalUpdateMany).toHaveBeenCalledWith({
      where: { id: "project-1", member: { userId: "trusted-user" } },
      data: { thumbnailUrl: "https://blob.example/image.jpg" },
    });
  });

  it("does not upload when authentication fails", async () => {
    mocks.requireCurrentMember.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(
      uploadMedia({ status: "idle", message: "" }, uploadForm()),
    ).rejects.toThrow("Forbidden");
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });

  it("removes the new Blob when its database attachment fails", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("Database unavailable"));

    const result = await uploadMedia(
      { status: "idle", message: "" },
      uploadForm(),
    );

    expect(result.status).toBe("error");
    expect(mocks.deleteUploadedBlob).toHaveBeenCalledWith(
      "personal-projects/project-1/image.jpg",
    );
  });

  it("rejects a rate-limited upload before writing a Blob", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
    });

    const result = await uploadMedia(
      { status: "idle", message: "" },
      uploadForm(),
    );

    expect(result.status).toBe("error");
    expect(result.message).toMatch(/too many uploads/i);
    expect(mocks.uploadImage).not.toHaveBeenCalled();
  });
});
