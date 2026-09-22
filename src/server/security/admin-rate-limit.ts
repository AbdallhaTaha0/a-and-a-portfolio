import "server-only";

import { consumeRateLimit } from "@/server/security/rate-limit";

/** Shared across high-impact administrative actions, not per resource ID. */
export async function checkAdminMutationLimit(actorUserId: string): Promise<string | null> {
  try {
    const result = await consumeRateLimit({
      scope: "admin-high-impact",
      identifier: actorUserId,
      limit: 20,
      windowMs: 60 * 60 * 1_000,
    });

    return result.allowed
      ? null
      : "Too many sensitive changes were attempted recently. Please try again later.";
  } catch (error) {
    console.error("Administrator action rate limiter failed", {
      actorUserId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return "Action protection is temporarily unavailable. Please try again.";
  }
}
