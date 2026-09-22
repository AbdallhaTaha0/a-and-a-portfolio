import "server-only";

import { headers } from "next/headers";

import { createRateLimitKey, extractClientAddress } from "@/lib/rate-limit";
import { prisma } from "@/server/db/prisma";

type RateLimitRow = {
  count: number;
  expiresAt: Date;
};

type RateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for rate limiting.");
  if (!Number.isInteger(limit) || limit < 1) throw new Error("Rate limit must be positive.");
  if (!Number.isInteger(windowMs) || windowMs < 1_000) {
    throw new Error("Rate-limit window must be at least one second.");
  }

  const key = createRateLimitKey(scope, identifier, secret);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  const [row] = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now}
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt}
        ELSE "RateLimitBucket"."expiresAt"
      END
    RETURNING "count", "expiresAt"
  `;

  if (!row) throw new Error("Rate-limit bucket was not returned.");

  return {
    allowed: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1_000),
    ),
  };
}

export async function consumeRequestRateLimit(
  options: Omit<RateLimitOptions, "identifier">,
) {
  const requestHeaders = await headers();
  return consumeRateLimit({
    ...options,
    identifier: extractClientAddress(requestHeaders),
  });
}
