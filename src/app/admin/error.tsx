"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center bg-[#080808] px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-red-400/25 bg-red-400/5 p-8 sm:p-10">
        <p className="text-xs font-bold tracking-[0.16em] text-red-200 uppercase">
          Dashboard unavailable
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em]">
          We couldn&apos;t load this workspace
        </h1>
        <p className="mt-4 leading-7 text-white/60">
          Try loading it again. If the problem continues, contact a team administrator.
        </p>
        <button className="mt-7 min-h-11 cursor-pointer rounded-full bg-white px-5 font-semibold text-[#080808] transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]" onClick={reset} type="button">
          Try again
        </button>
      </section>
    </main>
  );
}
