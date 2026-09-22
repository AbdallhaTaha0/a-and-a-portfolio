import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTeamAdmin: vi.fn(),
  getProjectPreviewById: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireTeamAdmin: mocks.requireTeamAdmin,
}));
vi.mock("@/server/projects/public-projects", () => ({
  getProjectPreviewById: mocks.getProjectPreviewById,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components/projects/project-detail", () => ({
  ProjectDetail: vi.fn(),
}));

import AdminProjectPreviewPage from "./page";

describe("AdminProjectPreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTeamAdmin.mockResolvedValue({ id: "admin-1" });
    mocks.getProjectPreviewById.mockResolvedValue({ id: "project-1" });
    mocks.notFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });
  });

  it("authorizes before loading the saved project preview", async () => {
    await AdminProjectPreviewPage({
      params: Promise.resolve({ projectId: "project-1" }),
    });

    expect(mocks.requireTeamAdmin).toHaveBeenCalledOnce();
    expect(mocks.getProjectPreviewById).toHaveBeenCalledWith("project-1");
    expect(
      mocks.requireTeamAdmin.mock.invocationCallOrder[0],
    ).toBeLessThan(mocks.getProjectPreviewById.mock.invocationCallOrder[0] ?? Infinity);
  });

  it("does not query preview data when authorization fails", async () => {
    mocks.requireTeamAdmin.mockRejectedValueOnce(new Error("FORBIDDEN"));

    await expect(
      AdminProjectPreviewPage({
        params: Promise.resolve({ projectId: "project-1" }),
      }),
    ).rejects.toThrow("FORBIDDEN");
    expect(mocks.getProjectPreviewById).not.toHaveBeenCalled();
  });

  it("uses the not-found boundary for an unknown project", async () => {
    mocks.getProjectPreviewById.mockResolvedValueOnce(null);

    await expect(
      AdminProjectPreviewPage({
        params: Promise.resolve({ projectId: "missing" }),
      }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
