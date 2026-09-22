import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connection: vi.fn(),
  memberFindMany: vi.fn(),
  technologyFindMany: vi.fn(),
  achievementFindMany: vi.fn(),
  testimonialFindMany: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("@/server/db/prisma", () => ({
  prisma: {
    member: { findMany: mocks.memberFindMany },
    technology: { findMany: mocks.technologyFindMany },
    teamAchievement: { findMany: mocks.achievementFindMany },
    testimonial: { findMany: mocks.testimonialFindMany },
  },
}));

import { getPublicHomeHighlights } from "./public-home";

describe("getPublicHomeHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.memberFindMany.mockResolvedValue([]);
    mocks.technologyFindMany.mockResolvedValue([]);
    mocks.achievementFindMany.mockResolvedValue([]);
    mocks.testimonialFindMany.mockResolvedValue([]);
  });

  it("filters draft-controlled content before returning landing-page highlights", async () => {
    await expect(getPublicHomeHighlights()).resolves.toEqual({
      members: [],
      technologies: [],
      achievements: [],
      testimonials: [],
    });

    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(mocks.memberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true }, take: 6 }),
    );
    expect(mocks.technologyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projects: { some: { project: { isPublished: true } } } },
        take: 24,
      }),
    );
    expect(mocks.testimonialFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublished: true }, take: 6 }),
    );
  });
});
