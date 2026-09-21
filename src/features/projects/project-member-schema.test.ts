import { describe, expect, it } from "vitest";

import { projectMemberSchema, readProjectMemberForm } from "./project-member-schema";

describe("project member validation", () => {
  it("normalizes optional role and contribution fields", () => {
    const result = projectMemberSchema.safeParse({
      projectId: "project-1",
      memberId: "member-1",
      role: "  Lead engineer  ",
      contribution: "  Built the platform.  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("Lead engineer");
      expect(result.data.contribution).toBe("Built the platform.");
    }
  });

  it("rejects missing relationship identifiers", () => {
    expect(projectMemberSchema.safeParse({ projectId: "", memberId: "" }).success).toBe(false);
  });

  it("allowlists assignment fields", () => {
    const formData = new FormData();
    formData.set("projectId", "project-1");
    formData.set("memberId", "member-1");
    formData.set("role", "Engineer");
    formData.set("isPublished", "true");
    formData.set("userId", "injected-user");
    expect(readProjectMemberForm(formData)).toEqual({
      projectId: "project-1",
      memberId: "member-1",
      role: "Engineer",
      contribution: null,
    });
  });
});
