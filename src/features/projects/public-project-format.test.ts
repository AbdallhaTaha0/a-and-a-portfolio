import { describe, expect, it } from "vitest";

import { projectDateRange, projectStatusLabel } from "./public-project-format";

describe("public project formatting", () => {
  it("formats every project status for visitors", () => {
    expect(projectStatusLabel("PLANNING")).toBe("Planning");
    expect(projectStatusLabel("IN_PROGRESS")).toBe("In progress");
    expect(projectStatusLabel("COMPLETED")).toBe("Completed");
    expect(projectStatusLabel("ARCHIVED")).toBe("Archived");
  });

  it("formats complete and open project date ranges", () => {
    expect(
      projectDateRange(
        new Date("2025-01-01T00:00:00.000Z"),
        new Date("2025-06-01T00:00:00.000Z"),
      ),
    ).toBe("Jan 2025 — Jun 2025");
    expect(projectDateRange(new Date("2025-01-01T00:00:00.000Z"), null)).toBe(
      "Started Jan 2025",
    );
    expect(projectDateRange(null, null)).toBeNull();
  });
});
