import { describe, expect, it } from "vitest";

import { safeExternalUrl, safeHttpsUrl } from "./urls";

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

  it("can enforce HTTPS for production-facing external links", () => {
    expect(safeHttpsUrl("https://example.com/profile")).toBe(
      "https://example.com/profile",
    );
    expect(safeHttpsUrl("http://example.com/profile")).toBeNull();
  });
});
