import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberPortrait } from "@/components/members/member-portrait";
import { PublicFooter, PublicHeader } from "@/components/site/public-header";
import { safeExternalUrl } from "@/lib/urls";
import { getPublishedMemberBySlug } from "@/server/members/public-members";

export const dynamic = "force-dynamic";

type MemberPageProps = {
  params: Promise<{ slug: string }>;
};

const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function dateRange(start: Date, end: Date | null, isCurrent = false) {
  return `${monthYear.format(start)} — ${isCurrent ? "Present" : end ? monthYear.format(end) : "Present"}`;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

export async function generateMetadata({
  params,
}: MemberPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getPublishedMemberBySlug(slug);

  if (!member) {
    return { title: "Member not found" };
  }

  const description =
    member.headline ??
    member.bio?.slice(0, 160) ??
    `Explore ${member.fullName}'s public portfolio at A&A.`;
  const imageUrl = safeExternalUrl(member.profileImageUrl);

  return {
    title: member.fullName,
    description,
    alternates: { canonical: `/members/${member.slug}` },
    openGraph: {
      title: `${member.fullName} | A&A Portfolio`,
      description,
      type: "profile",
      url: `/members/${member.slug}`,
      images: imageUrl?.startsWith("https://")
        ? [{ url: imageUrl, alt: `${member.fullName} portrait` }]
        : undefined,
    },
  };
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { slug } = await params;
  const member = await getPublishedMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  const safeSocialLinks = member.socialLinks
    .map((link) => ({ ...link, url: safeExternalUrl(link.url) }))
    .filter((link): link is typeof link & { url: string } => Boolean(link.url));

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]/70">
      <PublicHeader />
      <main>
        <section className="mx-auto grid w-[min(calc(100%-2rem),80rem)] gap-10 py-14 sm:py-20 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-center lg:gap-20">
          <MemberPortrait eager name={member.fullName} url={member.profileImageUrl} />
          <div>
            <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/members">
              ← All members
            </Link>
            <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
              A&amp;A member
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.06em] sm:text-7xl">
              {member.fullName}
            </h1>
            {member.headline ? (
              <p className="mt-5 max-w-3xl text-xl leading-8 text-white/65 sm:text-2xl">
                {member.headline}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              {member.location ? (
                <span className="rounded-full border border-white/10 px-4 py-2 text-white/55">
                  {member.location}
                </span>
              ) : null}
              {member.publicEmail ? (
                <a className="rounded-full border border-[#ffb800]/35 px-4 py-2 font-semibold text-[#ffc83d] transition hover:bg-[#ffb800]/10" href={`mailto:${member.publicEmail}`}>
                  Contact {member.fullName.split(" ")[0]}
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {member.bio ? (
          <section className="border-y border-white/10 bg-white/[0.025]">
            <div className="mx-auto grid w-[min(calc(100%-2rem),80rem)] gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Introduction" title="About" />
              <p className="max-w-3xl whitespace-pre-line text-lg leading-8 text-white/70">
                {member.bio}
              </p>
            </div>
          </section>
        ) : null}

        <div className="mx-auto w-[min(calc(100%-2rem),80rem)] divide-y divide-white/10">
          {member.skills.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Capabilities" title="Skills" />
              <ul className="flex flex-wrap content-start gap-3">
                {member.skills.map(({ proficiency, skill }) => (
                  <li className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2.5 text-sm text-white/75" key={skill.name}>
                    {skill.name}
                    {proficiency ? <span className="ml-2 text-white/35">{proficiency}%</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {member.experience.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Career" title="Experience" />
              <div className="space-y-4">
                {member.experience.map((item, index) => (
                  <article className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8" key={`${item.company}-${item.position}-${index}`}>
                    <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">
                      {dateRange(item.startDate, item.endDate, item.isCurrent)}
                    </p>
                    <h3 className="mt-3 text-xl font-bold">{item.position}</h3>
                    <p className="mt-1 text-white/55">{item.company}</p>
                    {item.description ? <p className="mt-5 whitespace-pre-line leading-7 text-white/65">{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.education.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Learning" title="Education" />
              <div className="grid gap-4 sm:grid-cols-2">
                {member.education.map((item, index) => (
                  <article className="rounded-3xl border border-white/10 bg-white/[0.025] p-6" key={`${item.institution}-${item.degree}-${index}`}>
                    <p className="text-xs font-bold tracking-[0.1em] text-white/35 uppercase">
                      {dateRange(item.startDate, item.endDate, item.isCurrent)}
                    </p>
                    <h3 className="mt-3 text-lg font-bold">{item.degree}</h3>
                    <p className="mt-1 text-white/60">{item.fieldOfStudy}</p>
                    <p className="mt-3 text-sm text-[#ffc83d]">{item.institution}</p>
                    {item.description ? <p className="mt-4 leading-7 text-white/60">{item.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {member.personalProjects.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Selected work" title="Projects" />
              <div className="grid gap-4 sm:grid-cols-2">
                {member.personalProjects.map((project) => {
                  const liveUrl = safeExternalUrl(project.liveUrl);
                  const githubUrl = safeExternalUrl(project.githubUrl);
                  return (
                    <article className="rounded-3xl border border-white/10 bg-white/[0.025] p-6" key={project.slug}>
                      {project.isFeatured ? <p className="text-xs font-bold tracking-[0.1em] text-[#ffc83d] uppercase">Featured</p> : null}
                      <h3 className="mt-2 text-xl font-bold">{project.title}</h3>
                      {project.shortDescription ?? project.description ? (
                        <p className="mt-3 leading-7 text-white/60">{project.shortDescription ?? project.description}</p>
                      ) : null}
                      {liveUrl || githubUrl ? (
                        <div className="mt-5 flex gap-4 text-sm font-semibold">
                          {liveUrl ? <a className="text-[#ffc83d] hover:underline" href={liveUrl} rel="noreferrer" target="_blank">View project ↗</a> : null}
                          {githubUrl ? <a className="text-white/55 hover:text-white" href={githubUrl} rel="noreferrer" target="_blank">GitHub ↗</a> : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {member.certifications.length || member.achievements.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Recognition" title="Milestones" />
              <div className="grid gap-4 sm:grid-cols-2">
                {member.certifications.map((item, index) => {
                  const credentialUrl = safeExternalUrl(item.credentialUrl);
                  return (
                    <article className="rounded-3xl border border-white/10 bg-white/[0.025] p-6" key={`${item.name}-${item.issuer}-${index}`}>
                      <p className="text-xs font-bold tracking-[0.1em] text-white/35 uppercase">Certification · {monthYear.format(item.issueDate)}</p>
                      <h3 className="mt-3 text-lg font-bold">{item.name}</h3>
                      <p className="mt-1 text-white/55">{item.issuer}</p>
                      {item.description ? <p className="mt-4 leading-7 text-white/60">{item.description}</p> : null}
                      {credentialUrl ? <a className="mt-4 inline-block text-sm font-semibold text-[#ffc83d] hover:underline" href={credentialUrl} rel="noreferrer" target="_blank">View credential ↗</a> : null}
                    </article>
                  );
                })}
                {member.achievements.map((item, index) => {
                  const itemUrl = safeExternalUrl(item.url);
                  return (
                    <article className="rounded-3xl border border-white/10 bg-white/[0.025] p-6" key={`${item.title}-${index}`}>
                      <p className="text-xs font-bold tracking-[0.1em] text-white/35 uppercase">Achievement{item.date ? ` · ${monthYear.format(item.date)}` : ""}</p>
                      <h3 className="mt-3 text-lg font-bold">{item.title}</h3>
                      {item.issuer ? <p className="mt-1 text-white/55">{item.issuer}</p> : null}
                      <p className="mt-4 leading-7 text-white/60">{item.description}</p>
                      {itemUrl ? <a className="mt-4 inline-block text-sm font-semibold text-[#ffc83d] hover:underline" href={itemUrl} rel="noreferrer" target="_blank">Learn more ↗</a> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {safeSocialLinks.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <SectionHeading eyebrow="Around the web" title="Connect" />
              <ul className="flex flex-wrap content-start gap-3">
                {safeSocialLinks.map((link) => (
                  <li key={`${link.platform}-${link.url}`}>
                    <a className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-[#ffb800]/50 hover:text-white" href={link.url} rel="noreferrer" target="_blank">
                      {link.platform} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
