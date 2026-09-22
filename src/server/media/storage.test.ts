import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
  sharp: vi.fn(),
  metadata: vi.fn(),
  rotate: vi.fn(),
  resize: vi.fn(),
  webp: vi.fn(),
  toBuffer: vi.fn(),
  mediaFindFirst: vi.fn(),
  mediaDeleteMany: vi.fn(),
  referenceCount: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: mocks.put,
  del: mocks.del,
}));
vi.mock("sharp", () => ({ default: mocks.sharp }));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    media: {
      findFirst: mocks.mediaFindFirst,
      deleteMany: mocks.mediaDeleteMany,
    },
    team: { count: mocks.referenceCount },
    member: { count: mocks.referenceCount },
    personalProject: { count: mocks.referenceCount },
    project: { count: mocks.referenceCount },
    achievement: { count: mocks.referenceCount },
    teamAchievement: { count: mocks.referenceCount },
    testimonial: { count: mocks.referenceCount },
    projectImage: { count: mocks.referenceCount },
  },
}));

import { deleteMediaIfUnreferenced, uploadImage, validateImageFile } from "./storage";

function imageFile(bytes: number[], name: string, type: string) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("media storage validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VERCEL_OIDC_TOKEN", "");
    vi.stubEnv("BLOB_STORE_ID", "");
    mocks.put.mockResolvedValue({
      url: "https://blob.example/profiles/member/image.webp",
      pathname: "profiles/member/image.webp",
      contentType: "image/webp",
    });
    const pipeline = {
      metadata: mocks.metadata,
      rotate: mocks.rotate,
      resize: mocks.resize,
      webp: mocks.webp,
      toBuffer: mocks.toBuffer,
    };
    mocks.sharp.mockReturnValue(pipeline);
    mocks.metadata.mockResolvedValue({ width: 800, height: 600 });
    mocks.rotate.mockReturnValue(pipeline);
    mocks.resize.mockReturnValue(pipeline);
    mocks.webp.mockReturnValue(pipeline);
    mocks.toBuffer.mockResolvedValue(Buffer.from([1, 2, 3]));
    mocks.mediaFindFirst.mockResolvedValue({ id: "media-1", storageKey: "profiles/image.webp" });
    mocks.mediaDeleteMany.mockResolvedValue({ count: 1 });
    mocks.referenceCount.mockResolvedValue(0);
  });

  it.each([
    [[0xff, 0xd8, 0xff, 0x00], "portrait.jpg", "image/jpeg"],
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "portrait.png", "image/png"],
    [[0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "portrait.webp", "image/webp"],
  ])("accepts a supported image signature", async (bytes, name, type) => {
    await expect(validateImageFile(imageFile(bytes, name, type))).resolves.toMatchObject({
      success: true,
    });
  });

  it("rejects spoofed contents even when MIME and extension claim PNG", async () => {
    const result = await validateImageFile(
      imageFile([0x6e, 0x6f, 0x74, 0x2d, 0x61, 0x6e, 0x2d, 0x69], "fake.png", "image/png"),
    );
    expect(result).toEqual({
      success: false,
      message: "The file contents do not match a supported image format.",
    });
  });

  it("rejects a filename extension that disagrees with the MIME type", async () => {
    const result = await validateImageFile(
      imageFile([0xff, 0xd8, 0xff, 0x00], "portrait.png", "image/jpeg"),
    );
    expect(result.success).toBe(false);
  });

  it("uses an immutable server-generated pathname instead of the supplied filename", async () => {
    const file = imageFile([0xff, 0xd8, 0xff, 0x00], "../../unsafe name.jpg", "image/jpeg");
    const result = await uploadImage({
      file,
      folder: "profiles",
      ownerId: "member-1",
      width: 1200,
    });

    expect(mocks.put).toHaveBeenCalledWith(
      expect.stringMatching(/^profiles\/member-1\/[a-f0-9-]+\.webp$/),
      expect.anything(),
      expect.objectContaining({ access: "public", contentType: "image/webp" }),
    );
    expect(mocks.put.mock.calls[0]?.[1]).toEqual(Buffer.from([1, 2, 3]));
    expect(result.filename).toBe("../../unsafe name.jpg");
  });

  it("does not delete a stored object while any database reference remains", async () => {
    mocks.referenceCount.mockResolvedValueOnce(1);
    await expect(
      deleteMediaIfUnreferenced("https://blob.example/profiles/image.webp"),
    ).resolves.toBe(false);
    expect(mocks.del).not.toHaveBeenCalled();
    expect(mocks.mediaDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes both the Blob and metadata after every reference is gone", async () => {
    await expect(
      deleteMediaIfUnreferenced("https://blob.example/profiles/image.webp"),
    ).resolves.toBe(true);
    expect(mocks.del).toHaveBeenCalledWith("profiles/image.webp");
    expect(mocks.mediaDeleteMany).toHaveBeenCalledWith({
      where: {
        id: "media-1",
        url: "https://blob.example/profiles/image.webp",
      },
    });
  });
});
