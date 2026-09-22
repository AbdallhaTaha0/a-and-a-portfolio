import { createHmac } from "node:crypto";

const UNKNOWN_CLIENT = "unknown-client";

export function extractClientAddress(requestHeaders: Headers) {
  const rawAddress =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for") ??
    requestHeaders.get("x-real-ip");

  return rawAddress?.split(",")[0]?.trim() || UNKNOWN_CLIENT;
}

export function createRateLimitKey(
  scope: string,
  identifier: string,
  secret: string,
) {
  const normalizedScope = scope.trim().toLowerCase();
  const digest = createHmac("sha256", secret)
    .update(identifier.trim().toLowerCase())
    .digest("hex");

  return `${normalizedScope}:${digest}`;
}
