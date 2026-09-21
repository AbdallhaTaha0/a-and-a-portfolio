"use server";

import { signIn, signOut } from "@/auth";

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/admin" });
}

export async function signOutCurrentUser() {
  await signOut({ redirectTo: "/" });
}
