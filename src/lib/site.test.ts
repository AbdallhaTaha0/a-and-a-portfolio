import { afterEach, describe, expect, it, vi } from "vitest";

import { getSiteOrigin, getSiteUrl } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("site URL configuration", () => {
  it("normalizes the configured origin and resolves application paths", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://portfolio.example.com/some/path");

    expect(getSiteOrigin()).toBe("https://portfolio.example.com");
    expect(getSiteUrl("/members/ada")).toBe(
      "https://portfolio.example.com/members/ada",
    );
  });

  it("uses localhost only outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(getSiteOrigin()).toBe("http://localhost:3000");
  });

  it("rejects missing or insecure production origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(() => getSiteOrigin()).toThrow(/required in production/i);

    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://portfolio.example.com");
    expect(() => getSiteOrigin()).toThrow(/HTTPS/i);
  });

  it("allows a loopback origin for local production-build verification", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(getSiteOrigin()).toBe("http://localhost:3000");
  });

  it("rejects unsupported protocols", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "javascript:alert(1)");

    expect(() => getSiteOrigin()).toThrow(/HTTP or HTTPS/i);
  });
});
