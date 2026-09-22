import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/components/site/public-header";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col bg-[#080808]/70">
      <PublicHeader />
      <main className="mx-auto grid w-[min(calc(100%-2rem),80rem)] flex-1 place-items-center py-20 text-center">
        <section className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-[#ffc83d] uppercase">
            Error 404
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.06em] sm:text-7xl">
            This page has moved out of view.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/60">
            The address may be incorrect, or the content may no longer be published.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-full bg-[#ffb800] px-6 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40"
              href="/"
            >
              Return home
            </Link>
            <Link
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
              href="/projects"
            >
              Browse projects
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
