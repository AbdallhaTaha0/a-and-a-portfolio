import Link from "next/link";

const navigationLinks = [
  { href: "/projects", label: "Projects" },
  { href: "/members", label: "Members" },
] as const;

export function PublicNavigation() {
  return (
    <>
      <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
        {navigationLinks.map((link) => (
          <Link
            className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
        <Link
          className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-semibold tracking-[0.08em] text-white/75 uppercase transition-colors hover:border-[#ffb800]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
          href="/login"
        >
          Team sign in
        </Link>
      </nav>

      <details className="group relative sm:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white/75 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800] [&::-webkit-details-marker]:hidden">
          Menu
          <span className="ml-2 text-[#ffc83d] transition group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>
        <nav
          aria-label="Mobile primary navigation"
          className="absolute right-0 z-30 mt-3 grid min-w-52 gap-1 rounded-2xl border border-white/15 bg-[#101010] p-2 shadow-2xl"
        >
          {navigationLinks.map((link) => (
            <Link
              className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-white/75 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="mt-1 flex min-h-11 items-center rounded-xl bg-[#ffb800] px-4 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            href="/login"
          >
            Team sign in
          </Link>
        </nav>
      </details>
    </>
  );
}

export function PublicHeader() {
  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex min-h-20 w-[min(calc(100%-2rem),80rem)] items-center gap-5">
        <Link
          aria-label="A&A home"
          className="mr-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg font-[family-name:var(--font-display)] text-[1.4rem] font-bold tracking-[-0.08em] outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808]"
          href="/"
        >
          A<span className="px-[0.12em] text-[#ffb800]">&amp;</span>A
        </Link>
        <PublicNavigation />
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto flex min-h-20 w-[min(calc(100%-2rem),80rem)] items-center justify-between gap-4 border-t border-white/10 text-xs text-white/45 max-sm:flex-col max-sm:items-start max-sm:justify-center">
      <p>A&amp;A — two perspectives, one direction.</p>
      <div className="flex gap-4">
        <Link className="inline-flex min-h-11 items-center transition hover:text-white" href="/projects">Projects</Link>
        <Link className="inline-flex min-h-11 items-center transition hover:text-white" href="/members">Meet the team</Link>
      </div>
    </footer>
  );
}
