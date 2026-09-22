import Link from "next/link";

import { MemberPortrait } from "@/components/members/member-portrait";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectMedia } from "@/components/projects/project-media";
import { PublicFooter, PublicHeader } from "@/components/site/public-header";
import {
  projectDateRange,
  projectStatusLabel,
} from "@/features/projects/public-project-format";
import { safeExternalUrl } from "@/lib/urls";
import type { ProjectDetailData } from "@/server/projects/public-projects";

export function ProjectDetail({
  preview = false,
  project,
}: {
  preview?: boolean;
  project: ProjectDetailData;
}) {
  const githubUrl = safeExternalUrl(project.githubUrl);
  const liveUrl = safeExternalUrl(project.liveUrl);
  const dates = projectDateRange(project.startDate, project.endDate);
  const backHref = preview ? `/admin/projects/${project.id}` : "/projects";
  const backLabel = preview ? "Back to project editor" : "All projects";

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]/70">
      {preview ? (
        <aside className="border-b border-[#ffb800]/25 bg-[#ffb800]/10 px-5 py-3 text-center text-sm text-[#ffe39a]">
          Protected preview of saved content. This does not publish the project.
        </aside>
      ) : null}
      <PublicHeader />
      <main>
        <section className="mx-auto w-[min(calc(100%-2rem),80rem)] py-14 sm:py-20">
          <Link
            className="text-sm font-semibold text-white/45 transition hover:text-white"
            href={backHref}
          >
            ← {backLabel}
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] lg:items-center lg:gap-16">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold tracking-[0.12em] uppercase">
                <span className="text-[#ffc83d]">
                  {projectStatusLabel(project.status)}
                </span>
                {project.isFeatured ? (
                  <span className="rounded-full border border-[#ffb800]/25 px-3 py-1.5 text-[#ffc83d]">
                    Featured work
                  </span>
                ) : null}
              </div>
              <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.06em] sm:text-7xl">
                {project.title}
              </h1>
              {project.shortDescription ? (
                <p className="mt-6 max-w-3xl text-xl leading-8 text-white/65">
                  {project.shortDescription}
                </p>
              ) : null}
              {dates ? <p className="mt-5 text-sm text-white/40">{dates}</p> : null}
              {liveUrl || githubUrl ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {liveUrl ? (
                    <a
                      className="rounded-full bg-[#ffb800] px-6 py-3 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d]"
                      href={liveUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Visit live project ↗
                    </a>
                  ) : null}
                  {githubUrl ? (
                    <a
                      className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/50 hover:text-white"
                      href={githubUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View GitHub ↗
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="group overflow-hidden rounded-3xl border border-white/15 shadow-[0_2rem_7rem_rgb(255_184_0/0.1)]">
              <ProjectMedia
                alt={`${project.title} project thumbnail`}
                eager
                url={project.thumbnailUrl}
              />
            </div>
          </div>
        </section>

        {project.description ? (
          <section className="border-y border-white/10 bg-white/[0.025]">
            <div className="mx-auto grid w-[min(calc(100%-2rem),80rem)] gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
                  Case study
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  The project
                </h2>
              </div>
              <p className="max-w-3xl whitespace-pre-line text-lg leading-8 text-white/70">
                {project.description}
              </p>
            </div>
          </section>
        ) : null}

        <div className="mx-auto w-[min(calc(100%-2rem),80rem)] divide-y divide-white/10">
          {project.technologies.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
                  Stack
                </p>
                <h2 className="mt-2 text-3xl font-bold">Technologies</h2>
              </div>
              <ul className="flex flex-wrap content-start gap-3">
                {project.technologies.map(({ technology }) => (
                  <li
                    className="rounded-full border border-white/12 bg-white/[0.035] px-4 py-2.5 text-sm text-white/75"
                    key={technology.name}
                  >
                    {technology.name}
                    {technology.category ? (
                      <span className="ml-2 text-white/35">{technology.category}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.members.length ? (
            <section className="grid gap-8 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)]">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
                  Collaboration
                </p>
                <h2 className="mt-2 text-3xl font-bold">Team</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.members.map(({ contribution, member, role }) => (
                  <Link
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-[#ffb800]/35"
                    href={`/members/${member.slug}`}
                    key={member.slug}
                  >
                    <MemberPortrait name={member.fullName} url={member.profileImageUrl} />
                    <div>
                      <h3 className="font-bold">{member.fullName}</h3>
                      <p className="mt-1 text-sm text-[#ffc83d]">
                        {role ?? member.headline ?? "Contributor"}
                      </p>
                      {contribution ? (
                        <p className="mt-3 text-sm leading-6 text-white/50">
                          {contribution}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {project.images.length ? (
            <section className="py-14 sm:py-20">
              <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
                Project gallery
              </p>
              <h2 className="mt-2 text-3xl font-bold">Behind the work</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {project.images.map((image, index) => (
                  <figure
                    className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]"
                    key={`${image.url}-${index}`}
                  >
                    <ProjectMedia alt={image.altText} url={image.url} />
                    <figcaption className="p-4 text-sm text-white/45">
                      {image.altText}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {project.relatedProjects.length ? (
            <section className="py-14 sm:py-20">
              <p className="text-xs font-bold tracking-[0.14em] text-[#ffc83d] uppercase">
                Keep exploring
              </p>
              <h2 className="mt-2 text-3xl font-bold">Related projects</h2>
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {project.relatedProjects.map((related) => (
                  <ProjectCard key={related.slug} project={related} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
