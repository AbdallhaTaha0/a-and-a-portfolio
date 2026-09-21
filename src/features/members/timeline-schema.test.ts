import { describe, expect, it } from "vitest";

import {
  educationSchema,
  experienceSchema,
  readEducationFormData,
  toEducationData,
} from "./timeline-schema";

describe("member timeline validation", () => {
  it("normalizes a current education record and clears its end date", () => {
    const result = educationSchema.safeParse({
      institution: " Cairo University ",
      degree: " Bachelor of Science ",
      fieldOfStudy: " Computer Science ",
      description: "",
      startDate: "2020-09-01",
      endDate: "2024-06-01",
      isCurrent: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(toEducationData(result.data)).toMatchObject({
      institution: "Cairo University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      description: null,
      endDate: null,
      isCurrent: true,
    });
  });

  it("rejects an end date earlier than the start date", () => {
    const result = experienceSchema.safeParse({
      company: "A&A",
      position: "Engineer",
      description: "",
      startDate: "2025-01-01",
      endDate: "2024-01-01",
      isCurrent: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors.endDate).toEqual([
      "End date cannot be before the start date.",
    ]);
  });

  it("rejects impossible calendar dates", () => {
    const result = experienceSchema.safeParse({
      company: "A&A",
      position: "Engineer",
      description: "",
      startDate: "2025-02-31",
      endDate: "",
      isCurrent: true,
    });

    expect(result.success).toBe(false);
  });

  it("allowlists fields and ignores injected ownership", () => {
    const formData = new FormData();
    formData.set("institution", "Cairo University");
    formData.set("degree", "BSc");
    formData.set("fieldOfStudy", "Computer Science");
    formData.set("startDate", "2020-09-01");
    formData.set("memberId", "another-member");

    expect(readEducationFormData(formData)).not.toHaveProperty("memberId");
  });
});
