import { describe, expect, it } from "vitest";
import { readTeamAchievementUpdateForm, teamAchievementCreateSchema, toTeamAchievementData } from "./team-achievement-schema";
describe("team achievement validation", () => {
  it("normalizes valid complete data", () => { const result = teamAchievementCreateSchema.safeParse({ title: " Award ", description: " Recognition ", issuer: "Org", date: "2026-02-01", imageUrl: "", url: "https://example.com", sortOrder: "2" }); expect(result.success).toBe(true); if (result.success) expect(toTeamAchievementData(result.data)).toMatchObject({ title: "Award", description: "Recognition", date: new Date("2026-02-01T00:00:00.000Z"), sortOrder: 2 }); });
  it("rejects impossible dates and insecure URLs", () => { expect(teamAchievementCreateSchema.safeParse({ title: "Award", description: "Recognition", date: "2026-02-30", url: "http://example.com", sortOrder: "0" }).success).toBe(false); });
  it("allowlists editable fields", () => { const data = new FormData(); data.set("achievementId", "a-1"); data.set("title", "Award"); data.set("description", "Recognition"); data.set("sortOrder", "0"); data.set("memberId", "injected"); expect(readTeamAchievementUpdateForm(data)).toEqual({ achievementId: "a-1", title: "Award", description: "Recognition", issuer: null, date: null, imageUrl: null, url: null, sortOrder: "0" }); });
});
