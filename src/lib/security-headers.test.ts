import { describe, expect, it } from "vitest";

import { createContentSecurityPolicy } from "@/lib/security-headers";

describe("content security policy", () => {
  it("uses a nonce and blocks dangerous embedding and plugins", () => {
    const policy = createContentSecurityPolicy("test-nonce", false);

    expect(policy).toContain("script-src 'self' 'nonce-test-nonce' 'strict-dynamic'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
  });

  it("allows only the development runtime additions in development", () => {
    const policy = createContentSecurityPolicy("test-nonce", true);

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self' ws: wss:");
    expect(policy).not.toContain("'unsafe-inline'");
  });
});
