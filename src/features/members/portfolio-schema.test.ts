import { describe, expect, it } from "vitest";

import {
  certificationSchema,
  personalProjectSchema,
  skillSchema,
  socialLinkSchema,
} from "./portfolio-schema";

describe("member portfolio validation", () => {
  it("normalizes optional skill proficiency", () => {
    expect(
      skillSchema.parse({ name: "TypeScript", category: "Frontend", proficiency: "90" }),
    ).toEqual({ name: "TypeScript", category: "Frontend", proficiency: 90 });
    expect(skillSchema.safeParse({ name: "TypeScript", proficiency: "101" }).success).toBe(
      false,
    );
  });

  it("requires chronological certification dates", () => {
    const result = certificationSchema.safeParse({
      name: "Cloud Professional",
      issuer: "Example",
      issueDate: "2026-04-01",
      expirationDate: "2025-04-01",
    });
    expect(result.success).toBe(false);
  });

  it("requires complete descriptions before publishing a personal project", () => {
    const result = personalProjectSchema.safeParse({
      title: "Portfolio",
      slug: "portfolio",
      isFeatured: false,
      isPublished: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.shortDescription).toBeDefined();
      expect(result.error.flatten().fieldErrors.description).toBeDefined();
    }
  });

  it("rejects insecure social links", () => {
    expect(
      socialLinkSchema.safeParse({ platform: "GitHub", url: "http://example.com/profile" })
        .success,
    ).toBe(false);
  });
});
