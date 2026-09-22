import Link from "next/link";

import { MemberPortrait } from "@/components/members/member-portrait";
import { ProjectMedia } from "@/components/projects/project-media";
import { safeHttpsUrl } from "@/lib/urls";
import { requireCurrentMember } from "@/server/auth/current-user";
import { getMemberPreview } from "@/server/members/public-members";

const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function dateRange(start: Date, end: Date | null, isCurrent = false) {
  return `${monthYear.format(start)} — ${isCurrent ? "Present" : end ? monthYear.format(end) : "Present"}`;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{children}</h2>;
}

export default async function MemberPreviewPage() {
  const { member: sessionMember } = await requireCurrentMember();
  const member = await getMemberPreview(sessionMember.id);

  if (!member) {
    return (
      <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
        <h1 className="text-3xl font-bold">Preview unavailable</h1>
        <p className="mt-3 text-white/55">Your linked member profile could not be loaded.</p>
      </div>
    );
  }

  const socialLinks = member.socialLinks
    .map((link) => ({ ...link, url: safeHttpsUrl(link.url) }))
    .filter((link): link is typeof link & { url: string } => Boolean(link.url));
  const hasPortfolioContent =
    member.skills.length ||
    member.experience.length ||
    member.education.length ||
    member.personalProjects.length ||
    member.projectMemberships.length ||
    member.certifications.length ||
    member.achievements.length ||
    socialLinks.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin/profile">
          ← Profile overview
        </Link>
        {sessionMember.isPublished ? (
          <Link className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/60 hover:text-white" href={`/members/${member.slug}`}>
            Open live profile ↗
          </Link>
        ) : null}
      </div>

      <aside className="mt-8 rounded-2xl border border-[#ffb800]/25 bg-[#ffb800]/5 px-5 py-4 text-sm leading-6 text-white/65">
        <strong className="text-[#ffc83d]">Private preview.</strong>{" "}
        {sessionMember.isPublished
          ? "This reflects your currently saved public content."
          : "Your profile is still a draft; only you can see this page."}{" "}
        Personal projects appear here only after their own publish switch is enabled.
      </aside>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl shadow-black/30">
        <section className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center lg:p-14">
          <MemberPortrait eager name={member.fullName} url={member.profileImageUrl} />
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">A&amp;A member</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.06em] sm:text-6xl">{member.fullName}</h1>
            {member.headline ? <p className="mt-5 text-xl leading-8 text-white/65">{member.headline}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/55">
              {member.location ? <span className="rounded-full border border-white/10 px-4 py-2">{member.location}</span> : null}
              {member.publicEmail ? <span className="rounded-full border border-[#ffb800]/30 px-4 py-2 text-[#ffc83d]">{member.publicEmail}</span> : null}
            </div>
          </div>
        </section>

        {member.bio ? (
          <section className="border-y border-white/10 bg-white/[0.025] p-6 sm:p-10 lg:p-14">
            <Heading>About</Heading>
            <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-white/70">{member.bio}</p>
          </section>
        ) : null}

        <div className="divide-y divide-white/10 px-6 sm:px-10 lg:px-14">
          {member.skills.length ? (
            <section className="py-10">
              <Heading>Skills</Heading>
              <ul className="mt-6 flex flex-wrap gap-3">
                {member.skills.map(({ proficiency, skill }) => (
                  <li className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2 text-sm text-white/75" key={skill.name}>
                    {skill.name}{proficiency ? <span className="ml-2 text-white/35">{proficiency}%</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {member.experience.length ? (
            <section className="py-10">
              <Heading>Experience</Heading>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {member.experience.map((item, index) => (
                  <article className="rounded-2xl border border-white/10 p-5" key={`${item.company}-${index}`}>
                    <p className="text-xs font-bold text-[#ffc83d] uppercase">{dateRange(item.startDate, item.endDate, item.isCurrent)}</p>
                    <h3 className="mt-3 text-lg font-bold">{item.position}</h3>
                    <p className="mt-1 text-white/50">{item.company}</p>
                    {item.description ? <p className="mt-4 whitespace-pre-line leading-7 text-white/60">{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.education.length ? (
            <section className="py-10">
              <Heading>Education</Heading>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {member.education.map((item, index) => (
                  <article className="rounded-2xl border border-white/10 p-5" key={`${item.institution}-${index}`}>
                    <p className="text-xs text-white/35 uppercase">{dateRange(item.startDate, item.endDate, item.isCurrent)}</p>
                    <h3 className="mt-3 text-lg font-bold">{item.degree}</h3>
                    <p className="mt-1 text-white/55">{item.fieldOfStudy}</p>
                    <p className="mt-2 text-sm text-[#ffc83d]">{item.institution}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.personalProjects.length ? (
            <section className="py-10">
              <Heading>Published personal projects</Heading>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {member.personalProjects.map((project) => (
                  <article className="group overflow-hidden rounded-2xl border border-white/10" key={project.slug}>
                    <ProjectMedia alt={`${project.title} preview`} url={project.thumbnailUrl} />
                    <div className="p-5">
                      <h3 className="text-lg font-bold">{project.title}</h3>
                      <p className="mt-3 leading-7 text-white/55">{project.shortDescription ?? project.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.projectMemberships.length ? (
            <section className="py-10">
              <Heading>Team contributions</Heading>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {member.projectMemberships.map((membership) => (
                  <article className="rounded-2xl border border-white/10 p-5" key={membership.project.slug}>
                    <p className="text-xs font-bold text-[#ffc83d] uppercase">{membership.role ?? "Contributor"}</p>
                    <h3 className="mt-3 text-lg font-bold">{membership.project.title}</h3>
                    {membership.contribution ? <p className="mt-3 leading-7 text-white/55">{membership.contribution}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.certifications.length || member.achievements.length ? (
            <section className="py-10">
              <Heading>Milestones</Heading>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {member.certifications.map((item) => (
                  <article className="rounded-2xl border border-white/10 p-5" key={`${item.name}-${item.issuer}`}>
                    <p className="text-xs text-white/35 uppercase">Certification · {monthYear.format(item.issueDate)}</p>
                    <h3 className="mt-3 text-lg font-bold">{item.name}</h3>
                    <p className="mt-1 text-white/50">{item.issuer}</p>
                  </article>
                ))}
                {member.achievements.map((item) => (
                  <article className="rounded-2xl border border-white/10 p-5" key={item.title}>
                    <p className="text-xs text-white/35 uppercase">Achievement</p>
                    <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                    <p className="mt-3 leading-7 text-white/55">{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {socialLinks.length ? (
            <section className="py-10">
              <Heading>Connect</Heading>
              <div className="mt-6 flex flex-wrap gap-3">
                {socialLinks.map((link) => <span className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70" key={`${link.platform}-${link.url}`}>{link.platform}</span>)}
              </div>
            </section>
          ) : null}

          {!hasPortfolioContent ? (
            <section className="py-10 text-sm leading-6 text-white/45">
              Add portfolio sections from your profile workspace to see them in this preview.
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
