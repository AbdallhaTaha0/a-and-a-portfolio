import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/components/site/public-header";

export default function MemberNotFound() {
  return (
    <div className="relative z-10 min-h-screen bg-[#080808]/70">
      <PublicHeader />
      <main className="mx-auto grid min-h-[70vh] w-[min(calc(100%-2rem),80rem)] place-items-center py-20 text-center">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Profile unavailable</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.05em]">That member page isn&apos;t public.</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/55">The profile may not exist, or its owner may still be preparing it.</p>
          <Link className="mt-8 inline-flex rounded-full bg-[#ffb800] px-6 py-3 font-bold text-[#080808] transition hover:bg-[#ffc83d]" href="/members">View published members</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
