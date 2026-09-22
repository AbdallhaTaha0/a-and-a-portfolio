import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn(),
  consumeRequestRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({
  signIn: mocks.signIn,
  signOut: mocks.signOut,
}));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));
vi.mock("@/server/security/rate-limit", () => ({
  consumeRequestRateLimit: mocks.consumeRequestRateLimit,
}));

import { signInWithGitHub, signInWithGoogle } from "./actions";

describe("OAuth sign-in rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirect.mockImplementation((url: string) => {
      throw new Error(`REDIRECT:${url}`);
    });
    mocks.consumeRequestRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
      retryAfterSeconds: 900,
    });
  });

  it("consumes a provider-specific limit before Google sign-in", async () => {
    await signInWithGoogle();

    expect(mocks.consumeRequestRateLimit).toHaveBeenCalledWith({
      scope: "login:google",
      limit: 20,
      windowMs: 900_000,
    });
    expect(mocks.signIn).toHaveBeenCalledWith("google", {
      redirectTo: "/admin",
    });
  });

  it("consumes a provider-specific limit before GitHub sign-in", async () => {
    await signInWithGitHub();

    expect(mocks.consumeRequestRateLimit).toHaveBeenCalledWith({
      scope: "login:github",
      limit: 20,
      windowMs: 900_000,
    });
    expect(mocks.signIn).toHaveBeenCalledWith("github", {
      redirectTo: "/admin",
    });
  });

  it("redirects a limited request without starting OAuth", async () => {
    mocks.consumeRequestRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 300,
    });

    await expect(signInWithGoogle()).rejects.toThrow(
      "REDIRECT:/login?error=TooManyRequests",
    );
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
});
