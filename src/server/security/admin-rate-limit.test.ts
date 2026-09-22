import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ consumeRateLimit: vi.fn() }));

vi.mock("@/server/security/rate-limit", () => ({
  consumeRateLimit: mocks.consumeRateLimit,
}));

import { checkAdminMutationLimit } from "./admin-rate-limit";

describe("administrator high-impact action limit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shares one per-actor bucket across sensitive actions", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true });

    expect(await checkAdminMutationLimit("admin-1")).toBeNull();
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith({
      scope: "admin-high-impact",
      identifier: "admin-1",
      limit: 20,
      windowMs: 3_600_000,
    });
  });

  it("rejects over-limit and unavailable protection without mutating", async () => {
    mocks.consumeRateLimit.mockResolvedValueOnce({ allowed: false });
    expect(await checkAdminMutationLimit("admin-1")).toMatch(/Too many/);

    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.consumeRateLimit.mockRejectedValueOnce(new Error("Database unavailable"));
    expect(await checkAdminMutationLimit("admin-1")).toMatch(/temporarily unavailable/);
    expect(log).toHaveBeenCalledWith("Administrator action rate limiter failed", {
      actorUserId: "admin-1",
      errorName: "Error",
    });
    log.mockRestore();
  });
});
