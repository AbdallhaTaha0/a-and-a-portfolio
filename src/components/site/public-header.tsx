import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex min-h-20 w-[min(calc(100%-2rem),80rem)] items-center gap-5">
        <Link
          aria-label="A&A home"
          className="mr-auto inline-flex rounded-lg font-[family-name:var(--font-display)] text-[1.4rem] font-bold tracking-[-0.08em] outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808]"
          href="/"
        >
          A<span className="px-[0.12em] text-[#ffb800]">&amp;</span>A
        </Link>
        <nav aria-label="Primary navigation" className="flex items-center gap-1">
          <Link
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
            href="/members"
          >
            Members
          </Link>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold tracking-[0.08em] text-white/75 uppercase transition-colors hover:border-[#ffb800]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
            href="/login"
          >
            Team sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto flex min-h-20 w-[min(calc(100%-2rem),80rem)] items-center justify-between gap-4 border-t border-white/10 text-xs text-white/45 max-sm:flex-col max-sm:items-start max-sm:justify-center">
      <p>A&amp;A — two perspectives, one direction.</p>
      <Link className="transition hover:text-white" href="/members">
        Meet the team
      </Link>
    </footer>
  );
}
