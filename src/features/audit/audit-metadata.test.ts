import { describe, expect, it } from "vitest";
import { formatAuditMetadata } from "./audit-metadata";
describe("audit metadata formatting", () => {
  it("renders only simple reviewable values in a stable order", () => {
    expect(formatAuditMetadata({ zeta: true, alpha: "value", nested: { secret: "hidden" }, list: ["hidden"], empty: null })).toEqual([
      { key: "alpha", value: "value" },
      { key: "empty", value: "—" },
      { key: "zeta", value: "true" },
    ]);
  });
  it("handles absent or non-object metadata", () => {
    expect(formatAuditMetadata(null)).toEqual([]);
    expect(formatAuditMetadata("value")).toEqual([]);
  });
});
