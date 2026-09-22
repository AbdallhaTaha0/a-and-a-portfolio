"use client";

import Link from "next/link";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center bg-[#080808]/80 px-5 py-12 text-white">
      <section className="w-full max-w-2xl rounded-[2rem] border border-white/12 bg-[#101010]/95 p-8 text-center shadow-[0_2rem_7rem_rgb(0_0_0/0.4)] sm:p-12">
        <p className="text-xs font-bold tracking-[0.18em] text-[#ffc83d] uppercase">
          Temporary interruption
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
          This page couldn&apos;t be loaded.
        </h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-white/60">
          Try again in a moment. If the problem continues, return home and contact the
          team.
        </p>
        {error.digest ? (
          <p className="mt-4 text-xs text-white/35">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
            href="/"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
