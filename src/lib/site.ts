const LOCAL_ORIGIN = "http://localhost:3000";

export const SITE_NAME = "A&A Portfolio";
export const SITE_DESCRIPTION =
  "The shared portfolio of the A&A team, its projects, and its members.";

export function getSiteOrigin() {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!configuredOrigin) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL is required in production.");
    }

    return LOCAL_ORIGIN;
  }

  const url = new URL(configuredOrigin);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP or HTTPS.");
  }

  const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !isLoopback
  ) {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production.");
  }

  return url.origin;
}

export function getSiteUrl(path = "/") {
  return new URL(path, `${getSiteOrigin()}/`).toString();
}
