"use server";

import { signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";

import { consumeRequestRateLimit } from "@/server/security/rate-limit";

async function signInWithProvider(provider: "google" | "github") {
  let allowed = false;

  try {
    const result = await consumeRequestRateLimit({
      scope: `login:${provider}`,
      limit: 20,
      windowMs: 15 * 60 * 1_000,
    });
    allowed = result.allowed;
  } catch (error) {
    console.error("Login rate limiter failed", {
      provider,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    redirect("/login?error=Configuration");
  }

  if (!allowed) redirect("/login?error=TooManyRequests");
  await signIn(provider, { redirectTo: "/admin" });
}

export async function signInWithGoogle() {
  await signInWithProvider("google");
}

export async function signInWithGitHub() {
  await signInWithProvider("github");
}

export async function signOutCurrentUser() {
  await signOut({ redirectTo: "/" });
}
