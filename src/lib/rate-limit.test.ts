import { describe, expect, it } from "vitest";

import { createRateLimitKey, extractClientAddress } from "@/lib/rate-limit";

describe("rate-limit identifiers", () => {
  it("prefers Vercel's protected forwarding header", () => {
    const requestHeaders = new Headers({
      "x-vercel-forwarded-for": "203.0.113.7",
      "x-forwarded-for": "198.51.100.2",
    });

    expect(extractClientAddress(requestHeaders)).toBe("203.0.113.7");
  });

  it("uses the first forwarded address and has a safe fallback", () => {
    expect(
      extractClientAddress(
        new Headers({ "x-forwarded-for": "203.0.113.8, 10.0.0.2" }),
      ),
    ).toBe("203.0.113.8");
    expect(extractClientAddress(new Headers())).toBe("unknown-client");
  });

  it("produces stable scoped keys without exposing the identifier", () => {
    const key = createRateLimitKey("Login:Google", "203.0.113.7", "secret");

    expect(key).toMatch(/^login:google:[a-f0-9]{64}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(key).toBe(
      createRateLimitKey("login:google", "203.0.113.7", "secret"),
    );
  });
});
