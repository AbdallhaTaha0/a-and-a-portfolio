import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import logo from "../../../logo.png";
import {
  signInWithGitHub,
  signInWithGoogle,
} from "@/features/auth/actions";
import { getCurrentUser } from "@/server/auth/current-user";
import { resolveLoginDestination } from "@/server/auth/policy";

export const metadata: Metadata = {
  title: "Team sign in",
  description: "Private sign-in for invited A&A team members.",
  robots: { index: false, follow: false, nocache: true },
};

const errorMessages: Record<string, string> = {
  AccessDenied: "This account has not been invited or is currently inactive.",
  AccountInactive: "This account is inactive. Contact the team administrator.",
  OAuthAccountNotLinked: "Use the provider previously linked to this account.",
  OAuthCallbackError: "The provider could not complete sign-in. Please try again.",
  TooManyRequests: "Too many sign-in attempts. Wait a few minutes and try again.",
  ProfileSetupRequired:
    "Your account is active, but a team administrator still needs to link your profile.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function ProviderIcon({ provider }: { provider: "google" | "github" }) {
  if (provider === "github") {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .7A11.5 11.5 0 0 0 8.36 23c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.2-3.12-.12-.3-.52-1.48.11-3.08 0 0 .98-.31 3.16 1.19a10.9 10.9 0 0 1 5.76 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.12 3.08.74.82 1.19 1.85 1.19 3.12 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.42l-3.25-2.52c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.89A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.89V7.5H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.5l3.35-2.61Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.82 1.5l2.88-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.35 2.61C7.18 7.74 9.39 5.98 12 5.98Z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ error }, user] = await Promise.all([searchParams, getCurrentUser()]);

  const signedInDestination = resolveLoginDestination(
    user
      ? {
          isActive: user.isActive,
          role: user.role,
          memberId: user.member?.id ?? null,
        }
      : null,
  );

  if (signedInDestination) {
    redirect(signedInDestination);
  }

  const effectiveError = error ?? (user ? "AccountInactive" : undefined);
  const message = effectiveError
    ? errorMessages[effectiveError] ?? "Sign-in could not be completed."
    : null;

  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-white/15 bg-[#101010]/85 p-8 shadow-[0_2rem_7rem_rgb(0_0_0/0.45)] backdrop-blur-xl sm:p-10">
        <Link
          className="mb-10 inline-flex rounded-2xl bg-white p-3 outline-none transition-transform hover:-rotate-1 focus-visible:ring-3 focus-visible:ring-[#ffb800]"
          href="/"
          aria-label="Return to A&A home"
        >
          <Image alt="A&A" className="h-12 w-auto" priority src={logo} />
        </Link>

        <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
          Private workspace
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.05em]">
          Sign in to A&A
        </h1>
        <p className="mt-4 leading-7 text-white/65">
          Use the Google or GitHub account connected to your team invitation.
        </p>

        {message ? (
          <p
            className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100"
            role="alert"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3">
          <form action={signInWithGoogle}>
            <button className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 font-semibold text-[#101010] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]" type="submit">
              <ProviderIcon provider="google" />
              Continue with Google
            </button>
          </form>
          <form action={signInWithGitHub}>
            <button className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 font-semibold text-white transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]" type="submit">
              <ProviderIcon provider="github" />
              Continue with GitHub
            </button>
          </form>
        </div>

        <p className="mt-8 text-xs leading-5 text-white/45">
          Access is limited to active team accounts. Authentication is stored in a secure,
          HTTP-only session cookie.
        </p>
      </section>
    </main>
  );
}
