import { describe, expect, it } from "vitest";

import { safeExternalUrl } from "./urls";

describe("safeExternalUrl", () => {
  it("allows HTTP and HTTPS links", () => {
    expect(safeExternalUrl("https://example.com/work")).toBe(
      "https://example.com/work",
    );
    expect(safeExternalUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/",
    );
  });

  it("rejects active, malformed, and absent links", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
  });
});
