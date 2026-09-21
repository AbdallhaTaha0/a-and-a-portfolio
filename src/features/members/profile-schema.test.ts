import { describe, expect, it } from "vitest";

import {
  memberProfileSchema,
  readMemberProfileFormData,
  toMemberProfileUpdate,
} from "./profile-schema";

describe("member profile validation", () => {
  it("normalizes valid profile input for persistence", () => {
    const result = memberProfileSchema.safeParse({
      fullName: "  Ada Lovelace  ",
      headline: "  Software engineer  ",
      bio: "  Builds thoughtful products.  ",
      location: "",
      publicEmail: " ada@example.com ",
      phone: "",
      profileImageUrl: "https://images.example.com/ada.jpg",
      isPublished: true,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(toMemberProfileUpdate(result.data)).toEqual({
      fullName: "Ada Lovelace",
      headline: "Software engineer",
      bio: "Builds thoughtful products.",
      location: null,
      publicEmail: "ada@example.com",
      phone: null,
      profileImageUrl: "https://images.example.com/ada.jpg",
      isPublished: true,
    });
  });

  it("requires a headline and biography before publication", () => {
    const result = memberProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      headline: "",
      bio: "",
      location: "",
      publicEmail: "",
      phone: "",
      profileImageUrl: "",
      isPublished: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    expect(result.error.flatten().fieldErrors).toMatchObject({
      headline: ["Add a headline before publishing."],
      bio: ["Add a biography before publishing."],
    });
  });

  it("rejects insecure image URLs", () => {
    const result = memberProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      headline: "Engineer",
      bio: "Builds products.",
      location: "",
      publicEmail: "",
      phone: "",
      profileImageUrl: "http://example.com/ada.jpg",
      isPublished: false,
    });

    expect(result.success).toBe(false);
  });

  it("returns a validation error for malformed image URLs without throwing", () => {
    const result = memberProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      headline: "Engineer",
      bio: "Builds products.",
      profileImageUrl: "not-a-url",
      isPublished: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.profileImageUrl).toBeDefined();
    }
  });

  it("allowlists form fields and ignores ownership or role injection", () => {
    const formData = new FormData();
    formData.set("fullName", "Ada Lovelace");
    formData.set("memberId", "another-member");
    formData.set("userId", "another-user");
    formData.set("role", "TEAM_ADMIN");

    expect(readMemberProfileFormData(formData)).toEqual({
      fullName: "Ada Lovelace",
      headline: null,
      bio: null,
      location: null,
      publicEmail: null,
      phone: null,
      profileImageUrl: null,
      isPublished: false,
    });
  });
});
