import Link from "next/link";

import { MemberPortrait } from "@/components/members/member-portrait";
import { safeExternalUrl } from "@/lib/urls";

type HomeHighlights = {
  members: Array<{
    slug: string;
    fullName: string;
    headline: string | null;
    profileImageUrl: string | null;
  }>;
  technologies: Array<{ name: string; category: string | null }>;
  achievements: Array<{
    title: string;
    description: string;
    issuer: string | null;
    date: Date | null;
    url: string | null;
  }>;
  testimonials: Array<{
    name: string;
    role: string | null;
    company: string | null;
    content: string;
  }>;
};

const yearFormat = new Intl.DateTimeFormat("en", {
  year: "numeric",
  timeZone: "UTC",
});

function SectionIntro({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{title}</h2>
    </div>
  );
}

export function HomeHighlightSections({ highlights }: { highlights: HomeHighlights }) {
  const hasContent =
    highlights.members.length ||
    highlights.technologies.length ||
    highlights.achievements.length ||
    highlights.testimonials.length;

  if (!hasContent) return null;

  return (
    <>
      {highlights.members.length ? (
        <section className="border-t border-white/10 py-16 md:py-24" id="team">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <SectionIntro eyebrow="The people behind the work" title="Meet the team" />
            <Link className="text-sm font-semibold text-white/55 transition hover:text-white" href="/members">View all members →</Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.members.map((member) => (
              <Link className="group grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.025] p-4 transition hover:-translate-y-1 hover:border-[#ffb800]/40" href={`/members/${member.slug}`} key={member.slug}>
                <MemberPortrait name={member.fullName} url={member.profileImageUrl} />
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold group-hover:text-[#ffc83d]">{member.fullName}</h3>
                  {member.headline ? <p className="mt-2 text-sm leading-6 text-white/50">{member.headline}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {highlights.technologies.length ? (
        <section className="grid gap-9 border-t border-white/10 py-16 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] md:py-24" id="technologies">
          <SectionIntro eyebrow="Tools and platforms" title="Technology that serves the work" />
          <ul className="flex flex-wrap content-start gap-3">
            {highlights.technologies.map((technology) => (
              <li className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2.5 text-sm text-white/75" key={technology.name}>
                {technology.name}
                {technology.category ? <span className="ml-2 text-white/35">{technology.category}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {highlights.achievements.length ? (
        <section className="border-t border-white/10 py-16 md:py-24" id="achievements">
          <SectionIntro eyebrow="Recognition" title="Milestones that moved us forward" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights.achievements.map((achievement, index) => {
              const achievementUrl = safeExternalUrl(achievement.url);
              const content = (
                <>
                  <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">
                    {achievement.date ? yearFormat.format(achievement.date) : "Team achievement"}
                  </p>
                  <h3 className="mt-4 text-xl font-bold">{achievement.title}</h3>
                  {achievement.issuer ? <p className="mt-1 text-sm text-white/40">{achievement.issuer}</p> : null}
                  <p className="mt-4 leading-7 text-white/55">{achievement.description}</p>
                  {achievementUrl ? <p className="mt-5 text-sm font-semibold text-[#ffc83d]">Learn more ↗</p> : null}
                </>
              );
              const className = "block rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:border-[#ffb800]/35";
              return achievementUrl ? (
                <a className={className} href={achievementUrl} key={`${achievement.title}-${index}`} rel="noreferrer" target="_blank">{content}</a>
              ) : (
                <article className={className} key={`${achievement.title}-${index}`}>{content}</article>
              );
            })}
          </div>
        </section>
      ) : null}

      {highlights.testimonials.length ? (
        <section className="border-t border-white/10 py-16 md:py-24" id="testimonials">
          <SectionIntro eyebrow="What collaborators say" title="Built on trust" />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {highlights.testimonials.map((testimonial, index) => (
              <figure className="flex flex-col rounded-3xl border border-[#ffb800]/15 bg-[#ffb800]/[0.035] p-6" key={`${testimonial.name}-${index}`}>
                <blockquote className="flex-1 text-lg leading-8 text-white/70">“{testimonial.content}”</blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-5">
                  <p className="font-semibold">{testimonial.name}</p>
                  {testimonial.role || testimonial.company ? <p className="mt-1 text-sm text-white/40">{[testimonial.role, testimonial.company].filter(Boolean).join(" · ")}</p> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
