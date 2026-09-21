import { describe, expect, it } from "vitest";
import { readTechnologyUpdateForm, technologyCreateSchema } from "./technology-schema";

describe("technology validation", () => {
  it("normalizes valid reusable technology fields", () => {
    const result = technologyCreateSchema.safeParse({ name: " React ", category: " Frontend ", iconUrl: "https://example.com/react.png" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ name: "React", category: "Frontend", iconUrl: "https://example.com/react.png" });
  });
  it("rejects malformed or insecure icon URLs without throwing", () => {
    expect(technologyCreateSchema.safeParse({ name: "React", iconUrl: "not-a-url" }).success).toBe(false);
    expect(technologyCreateSchema.safeParse({ name: "React", iconUrl: "http://example.com/icon.png" }).success).toBe(false);
  });
  it("allowlists editable dictionary fields", () => {
    const formData = new FormData();
    formData.set("technologyId", "tech-1"); formData.set("name", "React"); formData.set("projectId", "injected-project");
    expect(readTechnologyUpdateForm(formData)).toEqual({ technologyId: "tech-1", name: "React", category: null, iconUrl: null });
  });
});
