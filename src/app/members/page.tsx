import type { Metadata } from "next";
import Link from "next/link";

import { MemberPortrait } from "@/components/members/member-portrait";
import { PublicFooter, PublicHeader } from "@/components/site/public-header";
import { getPublishedMembers } from "@/server/members/public-members";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team members",
  description: "Meet the people behind A&A and explore their public portfolios.",
  alternates: { canonical: "/members" },
};

export default async function MembersPage() {
  const members = await getPublishedMembers();

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]/70">
      <PublicHeader />
      <main className="mx-auto w-[min(calc(100%-2rem),80rem)] py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
            The people behind the work
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.055em] sm:text-7xl">
            Meet the A&amp;A team.
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/65">
            Explore each member&apos;s focus, experience, and independently published work.
          </p>
        </div>

        {members.length ? (
          <section className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Published members">
            {members.map((member) => (
              <Link
                className="group rounded-[1.75rem] border border-white/10 bg-[#101010]/85 p-4 transition hover:-translate-y-1 hover:border-[#ffb800]/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/50"
                href={`/members/${member.slug}`}
                key={member.slug}
              >
                <MemberPortrait name={member.fullName} url={member.profileImageUrl} />
                <div className="px-2 pb-3 pt-6">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.025em] group-hover:text-[#ffc83d]">
                    {member.fullName}
                  </h2>
                  {member.headline ? (
                    <p className="mt-2 text-sm leading-6 text-white/60">{member.headline}</p>
                  ) : null}
                  {member.location ? (
                    <p className="mt-3 text-xs font-semibold tracking-[0.08em] text-white/35 uppercase">
                      {member.location}
                    </p>
                  ) : null}
                  {member.skills.length ? (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${member.fullName} skills`}>
                      {member.skills.map(({ skill }) => (
                        <li className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55" key={skill.name}>
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="mt-14 rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-8 sm:p-12">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              Profiles are being prepared.
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-white/55">
              No member has published a profile yet. Check back soon to meet the team.
            </p>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
