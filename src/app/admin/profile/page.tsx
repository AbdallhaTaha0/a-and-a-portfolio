import Link from "next/link";

import { MemberProfileForm } from "@/features/members/profile-form";
import { requireCurrentMember } from "@/server/auth/current-user";

const upcomingAreas = [
  { label: "Experience", href: "/admin/profile/experience" },
  { label: "Education", href: "/admin/profile/education" },
  { label: "Skills" },
  { label: "Certifications" },
  { label: "Achievements" },
  { label: "Personal projects" },
  { label: "Social links" },
] as const;

export default async function MemberProfileDashboardPage() {
  const { user, member } = await requireCurrentMember();

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
            Personal workspace
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Edit your profile
          </h1>
          <p className="mt-3 max-w-2xl text-white/55">
            Keep your public introduction accurate. Draft changes remain private until
            you publish the profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-4 py-2 text-xs font-bold tracking-[0.08em] uppercase ${member.isPublished ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/15 bg-white/5 text-white/55"}`}>
            {member.isPublished ? "Published" : "Draft"}
          </span>
          {member.isPublished ? (
            <Link className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href={`/members/${member.slug}`}>
              View public profile
            </Link>
          ) : null}
        </div>
      </div>

      <MemberProfileForm profile={member} />

      <section className="mt-12" aria-labelledby="portfolio-sections-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-white/35 uppercase">
              Portfolio sections
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold" id="portfolio-sections-heading">
              Build out your story
            </h2>
          </div>
          <p className="text-sm text-white/40">More editors are being added incrementally.</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {upcomingAreas.map((area) =>
            "href" in area ? (
              <Link className="rounded-2xl border border-[#ffb800]/20 bg-[#ffb800]/5 p-5 text-sm font-semibold text-white/80 transition hover:border-[#ffb800]/50 hover:bg-[#ffb800]/10" href={area.href} key={area.label}>
                {area.label} <span className="text-[#ffc83d]">→</span>
              </Link>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm font-semibold text-white/45" key={area.label}>
                {area.label} <span className="ml-2 text-xs font-medium uppercase tracking-[0.08em] text-white/25">Soon</span>
              </div>
            ),
          )}
        </div>
      </section>

      {user.role === "TEAM_ADMIN" ? (
        <p className="mt-8 rounded-2xl border border-[#ffb800]/20 bg-[#ffb800]/5 px-5 py-4 text-sm leading-6 text-white/65">
          This account also has team-administrator access. Your personal profile remains
          separate from team-level content.
        </p>
      ) : null}
    </div>
  );
}
