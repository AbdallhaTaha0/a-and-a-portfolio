import type { ProjectStatus } from "@prisma/client";
import Link from "next/link";

import { ProjectMedia } from "@/components/projects/project-media";
import { projectStatusLabel } from "@/features/projects/public-project-format";

export type PublicProjectCardData = {
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  status: ProjectStatus;
  isFeatured: boolean;
  technologies: Array<{ technology: { name: string } }>;
};

export function ProjectCard({
  eager = false,
  project,
}: {
  eager?: boolean;
  project: PublicProjectCardData;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#101010]/85 transition duration-200 hover:-translate-y-1 hover:border-[#ffb800]/40">
      <Link className="block outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]" href={`/projects/${project.slug}`}>
        <ProjectMedia alt={`${project.title} project thumbnail`} eager={eager} url={project.thumbnailUrl} />
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-bold tracking-[0.1em] uppercase">
            <span className="text-[#ffc83d]">{projectStatusLabel(project.status)}</span>
            {project.isFeatured ? <span className="rounded-full border border-[#ffb800]/25 px-2.5 py-1 text-[#ffc83d]">Featured</span> : null}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.035em]">{project.title}</h2>
          {project.shortDescription ? <p className="mt-3 line-clamp-3 leading-7 text-white/55">{project.shortDescription}</p> : null}
          {project.technologies.length ? (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${project.title} technologies`}>
              {project.technologies.slice(0, 4).map(({ technology }) => (
                <li className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50" key={technology.name}>{technology.name}</li>
              ))}
            </ul>
          ) : null}
          <p className="mt-6 text-sm font-semibold text-[#ffc83d]">View project →</p>
        </div>
      </Link>
    </article>
  );
}
