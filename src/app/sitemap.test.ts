import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMembers: vi.fn(),
  getProjects: vi.fn(),
}));

vi.mock("@/server/members/public-members", () => ({
  getPublishedMemberSitemapEntries: mocks.getMembers,
}));
vi.mock("@/server/projects/public-projects", () => ({
  getPublishedProjectSitemapEntries: mocks.getProjects,
}));

import sitemap from "./sitemap";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("sitemap metadata", () => {
  it("contains public routes and database-selected published detail entries", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://portfolio.example.com");
    const updatedAt = new Date("2026-09-20T00:00:00.000Z");
    mocks.getProjects.mockResolvedValue([
      {
        slug: "atlas",
        updatedAt,
        thumbnailUrl: "https://images.example.com/atlas.webp",
      },
    ]);
    mocks.getMembers.mockResolvedValue([
      {
        slug: "ada",
        updatedAt,
        profileImageUrl: "http://insecure.example.com/ada.jpg",
      },
    ]);

    const entries = await sitemap();

    expect(entries.map(({ url }) => url)).toEqual([
      "https://portfolio.example.com/",
      "https://portfolio.example.com/projects",
      "https://portfolio.example.com/members",
      "https://portfolio.example.com/projects/atlas",
      "https://portfolio.example.com/members/ada",
    ]);
    expect(entries[3]?.images).toEqual([
      "https://images.example.com/atlas.webp",
    ]);
    expect(entries[4]?.images).toBeUndefined();
  });
});
