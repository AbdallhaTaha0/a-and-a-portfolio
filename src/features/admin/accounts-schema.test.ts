import { describe, expect, it } from "vitest";

import {
  administratorInvitationSchema,
  memberInvitationSchema,
  readMemberInvitationForm,
  suggestSlug,
} from "./accounts-schema";

describe("team account validation", () => {
  it("normalizes invited emails and validates stable slugs", () => {
    const result = memberInvitationSchema.safeParse({
      email: " MEMBER@Example.COM ",
      fullName: "Ada Lovelace",
      slug: "ada-lovelace",
      headline: "Engineer",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("member@example.com");
  });

  it("rejects unsafe slugs", () => {
    expect(
      memberInvitationSchema.safeParse({
        email: "member@example.com",
        fullName: "Ada Lovelace",
        slug: "Ada Lovelace/../",
        headline: "",
      }).success,
    ).toBe(false);
  });

  it("validates administrator invitations", () => {
    expect(
      administratorInvitationSchema.safeParse({
        email: "admin@example.com",
        name: "Second Admin",
      }).success,
    ).toBe(true);
  });

  it("allowlists fields and produces a safe slug suggestion", () => {
    const formData = new FormData();
    formData.set("email", "member@example.com");
    formData.set("fullName", "Áda & Team");
    formData.set("slug", "ada-team");
    formData.set("role", "TEAM_ADMIN");
    formData.set("userId", "target-user");

    expect(readMemberInvitationForm(formData)).not.toHaveProperty("role");
    expect(readMemberInvitationForm(formData)).not.toHaveProperty("userId");
    expect(suggestSlug(" Áda & Team ")).toBe("ada-team");
  });
});
