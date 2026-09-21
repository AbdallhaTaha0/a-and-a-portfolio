import Image from "next/image";
import Link from "next/link";

import logo from "../../logo.png";
import { getPublicTeam } from "@/server/team/team";

const foundationItems = [
  "Team projects",
  "Member portfolios",
  "Secure dashboards",
] as const;

const fallbackTeam = {
  name: "A&A",
  shortDescription:
    "A production-ready home for the team, its work, and every member's individual portfolio.",
  description: null,
  contactEmail: null,
  location: null,
  githubUrl: null,
  linkedinUrl: null,
};

export default async function Home() {
  const team = (await getPublicTeam()) ?? fallbackTeam;

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-[min(calc(100%-2.5rem),80rem)] flex-col max-sm:w-[min(calc(100%-2rem),80rem)]">
      <nav
        aria-label="Primary navigation"
        className="flex min-h-24 items-center justify-between border-b border-white/10 max-sm:min-h-20"
      >
        <a
          className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800] focus-visible:ring-offset-4 focus-visible:ring-offset-[#080808]"
          href="#top"
          aria-label="A&A home"
        >
          <span
            className="font-[family-name:var(--font-display)] text-[1.4rem] font-bold tracking-[-0.08em]"
            aria-hidden="true"
          >
            {team.name}
          </span>
        </a>

        <div className="flex items-center gap-1">
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
        </div>
      </nav>

      <section
        className="grid flex-1 grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] items-center gap-[clamp(3rem,8vw,7rem)] py-[clamp(5rem,12vh,9rem)] max-[52rem]:grid-cols-1 max-sm:py-16"
        id="top"
      >
        <div>
          <p className="mb-6 text-[0.8rem] font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
            Two perspectives. One direction.
          </p>
          <h1 className="max-w-[12ch] font-[family-name:var(--font-display)] text-[clamp(3.25rem,7vw,6.9rem)] leading-[0.94] font-bold tracking-[-0.075em] max-[52rem]:max-w-[11ch]">
            We build digital work with <em className="text-[#ffb800] not-italic">energy</em>{" "}
            and clarity.
          </h1>
          <p className="mt-8 max-w-[38rem] text-[clamp(1rem,2vw,1.2rem)] leading-7 text-white/75">
            {team.shortDescription ?? fallbackTeam.shortDescription}
          </p>

          <ul className="mt-9 flex list-none flex-wrap gap-3 p-0" aria-label="Platform areas">
            {foundationItems.map((item) => (
              <li
                className="rounded-full border border-white/10 bg-[#101010]/75 px-4 py-2.5 text-sm text-[#ededed]"
                key={item}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid justify-items-center gap-5">
          <div className="relative w-[min(100%,28rem)] rotate-[1.5deg] overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-[0_2rem_7rem_rgb(255_184_0/0.14)] after:absolute after:top-0 after:right-0 after:h-1 after:w-[42%] after:bg-[#ffb800] after:content-[''] max-[52rem]:w-[min(78vw,27rem)]">
            <Image
              alt="A&A team logo"
              className="block h-auto w-full"
              priority
              src={logo}
              sizes="(max-width: 768px) 72vw, 34vw"
            />
          </div>
          <p className="m-0 max-w-96 text-center text-sm leading-6 text-white/70">
            <span className="font-bold text-[#ffc83d]">Orange</span> brings momentum.
            White brings focus.
          </p>
        </div>
      </section>

      {team.description || team.location || team.contactEmail ? (
        <section className="grid gap-8 border-t border-white/10 py-16 md:grid-cols-[minmax(0,1fr)_minmax(16rem,0.42fr)] md:py-24" id="about">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">About {team.name}</p>
            <h2 className="mt-4 max-w-[14ch] font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl">Built together. Presented clearly.</h2>
            {team.description ? (
              <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-white/65">{team.description}</p>
            ) : null}
          </div>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Connect</p>
            {team.location ? <p className="mt-4 text-sm text-white/65">{team.location}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {team.contactEmail ? <a className="rounded-full bg-[#ffb800] px-5 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40" href={`mailto:${team.contactEmail}`}>Email the team</a> : null}
              {team.githubUrl ? <a className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/55 hover:text-white" href={team.githubUrl} rel="noreferrer" target="_blank">GitHub</a> : null}
              {team.linkedinUrl ? <a className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/55 hover:text-white" href={team.linkedinUrl} rel="noreferrer" target="_blank">LinkedIn</a> : null}
            </div>
          </aside>
        </section>
      ) : null}

      <footer className="flex min-h-20 items-center justify-between gap-4 border-t border-white/10 text-xs text-white/50 max-sm:flex-col max-sm:items-start max-sm:justify-center">
        <p>Designed around the {team.name} identity.</p>
        <p>Database-backed team platform.</p>
      </footer>
    </main>
  );
}
