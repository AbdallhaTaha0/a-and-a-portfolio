import { describe, expect, it } from "vitest";

import { projectCreateSchema, readProjectUpdateForm, toProjectData } from "./project-schema";

function validProject() {
  return {
    title: "Portfolio Platform",
    slug: "portfolio-platform",
    shortDescription: "A concise summary.",
    description: "A complete project description.",
    thumbnailUrl: "https://images.example.com/project.jpg",
    githubUrl: "https://github.com/example/project",
    liveUrl: "https://example.com",
    status: "IN_PROGRESS",
    startDate: "2026-01-10",
    endDate: "2026-03-12",
    isFeatured: true,
    isPublished: true,
    sortOrder: "4",
  };
}

describe("project validation", () => {
  it("normalizes complete project input for persistence", () => {
    const result = projectCreateSchema.safeParse(validProject());
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(toProjectData(result.data)).toMatchObject({
      title: "Portfolio Platform",
      status: "IN_PROGRESS",
      sortOrder: 4,
      startDate: new Date("2026-01-10T00:00:00.000Z"),
      endDate: new Date("2026-03-12T00:00:00.000Z"),
      isFeatured: true,
      isPublished: true,
    });
  });

  it("rejects incomplete publication requests", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject(),
      shortDescription: "",
      description: "",
      thumbnailUrl: "",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors).toMatchObject({
      shortDescription: ["Add a short description before publishing."],
      description: ["Add a full description before publishing."],
      thumbnailUrl: ["Add a thumbnail URL before publishing."],
    });
  });

  it("rejects an end date before the start date", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject(),
      startDate: "2026-04-01",
      endDate: "2026-03-01",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.endDate).toEqual([
      "End date must be on or after the start date.",
    ]);
  });

  it("rejects impossible calendar dates and malformed URLs without throwing", () => {
    const result = projectCreateSchema.safeParse({
      ...validProject(),
      startDate: "2026-02-30",
      githubUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors).toMatchObject({
      startDate: ["Enter a valid date."],
      githubUrl: ["Enter a complete URL."],
    });
  });

  it("allowlists fields and ignores ownership or relationship injection", () => {
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("title", "Project");
    formData.set("slug", "project");
    formData.set("status", "PLANNING");
    formData.set("sortOrder", "0");
    formData.set("memberId", "injected-member");
    formData.set("technologyId", "injected-technology");

    expect(readProjectUpdateForm(formData)).toEqual({
      projectId: "project-1",
      title: "Project",
      slug: "project",
      shortDescription: null,
      description: null,
      thumbnailUrl: null,
      githubUrl: null,
      liveUrl: null,
      status: "PLANNING",
      startDate: null,
      endDate: null,
      isFeatured: false,
      isPublished: false,
      sortOrder: "0",
    });
  });
});
