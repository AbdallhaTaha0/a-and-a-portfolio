import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), findUnique: vi.fn() }));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    member: {
      findFirst: mocks.findFirst,
      findUnique: mocks.findUnique,
      findMany: vi.fn(),
    },
  },
}));

import { getMemberPreview, getPublishedMemberBySlug } from "./public-members";

describe("getPublishedMemberBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(null);
    mocks.findUnique.mockResolvedValue(null);
  });

  it("selects only published personal projects and published team contributions", async () => {
    await getPublishedMemberBySlug("ada");

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "ada", isPublished: true },
        select: expect.objectContaining({
          personalProjects: expect.objectContaining({ where: { isPublished: true } }),
          projectMemberships: expect.objectContaining({
            where: { project: { isPublished: true } },
          }),
        }),
      }),
    );
  });

  it("loads a private profile preview by trusted member ID without weakening nested publication filters", async () => {
    await getMemberPreview("trusted-member");

    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trusted-member" },
        select: expect.objectContaining({
          personalProjects: expect.objectContaining({ where: { isPublished: true } }),
          projectMemberships: expect.objectContaining({
            where: { project: { isPublished: true } },
          }),
        }),
      }),
    );
  });
});
