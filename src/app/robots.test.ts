import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "./robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots metadata", () => {
  it("allows public pages and excludes private and authentication routes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://portfolio.example.com");

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/login"],
      },
      sitemap: "https://portfolio.example.com/sitemap.xml",
      host: "https://portfolio.example.com",
    });
  });
});
