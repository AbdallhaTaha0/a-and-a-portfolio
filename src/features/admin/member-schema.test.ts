import { describe, expect, it } from "vitest";

import {
  adminMemberDeleteSchema,
  adminMemberUpdateSchema,
  readAdminMemberUpdateForm,
  toAdminMemberUpdate,
} from "./member-schema";

function validMemberInput() {
  return {
    memberId: "member-1",
    slug: "ada-lovelace",
    teamOrder: "3",
    fullName: " Ada Lovelace ",
    headline: " Engineer ",
    bio: " Builds thoughtful products. ",
    location: "",
    publicEmail: "ada@example.com",
    phone: "",
    profileImageUrl: "https://images.example.com/ada.jpg",
    isPublished: true,
  };
}

describe("administrator Member validation", () => {
  it("normalizes a complete Member update", () => {
    const result = adminMemberUpdateSchema.safeParse(validMemberInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(toAdminMemberUpdate(result.data)).toEqual({
      slug: "ada-lovelace",
      teamOrder: 3,
      fullName: "Ada Lovelace",
      headline: "Engineer",
      bio: "Builds thoughtful products.",
      location: null,
      publicEmail: "ada@example.com",
      phone: null,
      profileImageUrl: "https://images.example.com/ada.jpg",
      isPublished: true,
    });
  });

  it("enforces publication requirements and a valid team position", () => {
    const result = adminMemberUpdateSchema.safeParse({
      ...validMemberInput(),
      headline: "",
      bio: "",
      teamOrder: "-1",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.flatten().fieldErrors).toMatchObject({
      headline: ["Add a headline before publishing."],
      bio: ["Add a biography before publishing."],
      teamOrder: ["Team position cannot be negative."],
    });
  });

  it("allowlists editable fields and ignores ownership injection", () => {
    const formData = new FormData();
    formData.set("memberId", "member-1");
    formData.set("slug", "ada-lovelace");
    formData.set("teamOrder", "0");
    formData.set("fullName", "Ada Lovelace");
    formData.set("userId", "attacker-selected-user");
    formData.set("role", "TEAM_ADMIN");
    formData.set("isActive", "false");

    expect(readAdminMemberUpdateForm(formData)).toEqual({
      memberId: "member-1",
      slug: "ada-lovelace",
      teamOrder: "0",
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

  it("requires explicit deletion confirmation input", () => {
    expect(
      adminMemberDeleteSchema.safeParse({ memberId: "member-1", confirmation: "" })
        .success,
    ).toBe(false);
  });
});
