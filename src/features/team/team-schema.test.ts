import { describe, expect, it } from "vitest";

import {
  readTeamContentFormData,
  teamContentSchema,
  toTeamContentUpdate,
} from "./team-schema";

describe("team content schema", () => {
  it("normalizes optional empty fields for persistence", () => {
    const formData = new FormData();
    formData.set("name", "  A&A Studio  ");
    formData.set("shortDescription", "  Digital products with energy.  ");
    formData.set("description", "");
    formData.set("contactEmail", "");
    formData.set("location", "  Cairo, Egypt  ");
    formData.set("githubUrl", "");
    formData.set("linkedinUrl", "");

    const parsed = teamContentSchema.parse(readTeamContentFormData(formData));

    expect(toTeamContentUpdate(parsed)).toEqual({
      name: "A&A Studio",
      shortDescription: "Digital products with energy.",
      description: null,
      contactEmail: null,
      location: "Cairo, Egypt",
      githubUrl: null,
      linkedinUrl: null,
    });
  });

  it("rejects insecure social URLs and invalid public email addresses", () => {
    const result = teamContentSchema.safeParse({
      name: "A&A",
      githubUrl: "http://github.com/example",
      linkedinUrl: "not-a-url",
      contactEmail: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.githubUrl).toBeDefined();
      expect(result.error.flatten().fieldErrors.linkedinUrl).toBeDefined();
      expect(result.error.flatten().fieldErrors.contactEmail).toBeDefined();
    }
  });
});
