import { describe, expect, it } from "vitest";

import { accountSettingsSchema } from "./account-settings-schema";

describe("account settings validation", () => {
  it("trims a dashboard display name and allows resetting it", () => {
    expect(accountSettingsSchema.parse({ name: "  Ada Lovelace  " })).toEqual({
      name: "Ada Lovelace",
    });
    expect(accountSettingsSchema.parse({ name: "" })).toEqual({ name: undefined });
  });

  it("rejects invalid display-name lengths", () => {
    expect(accountSettingsSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(accountSettingsSchema.safeParse({ name: "A".repeat(161) }).success).toBe(false);
  });
});
