import { describe, expect, it } from "vitest";

import { canApplyAccountCapabilityChange } from "./account-policy";

describe("administrator account safety policy", () => {
  it("rejects deactivating or demoting the final active administrator", () => {
    const activeAdmin = { role: "TEAM_ADMIN" as const, isActive: true };

    expect(
      canApplyAccountCapabilityChange(
        activeAdmin,
        { role: "TEAM_ADMIN", isActive: false },
        1,
      ),
    ).toBe(false);
    expect(
      canApplyAccountCapabilityChange(
        activeAdmin,
        { role: "MEMBER", isActive: true },
        1,
      ),
    ).toBe(false);
  });

  it("allows the change when another active administrator remains", () => {
    expect(
      canApplyAccountCapabilityChange(
        { role: "TEAM_ADMIN", isActive: true },
        { role: "MEMBER", isActive: true },
        2,
      ),
    ).toBe(true);
  });

  it("does not restrict member changes or administrator promotion", () => {
    expect(
      canApplyAccountCapabilityChange(
        { role: "MEMBER", isActive: true },
        { role: "TEAM_ADMIN", isActive: true },
        1,
      ),
    ).toBe(true);
  });
});
