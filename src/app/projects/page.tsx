import type { Metadata } from "next";

import { ProjectCard } from "@/components/projects/project-card";
import { PublicFooter, PublicHeader } from "@/components/site/public-header";
import { getPublishedProjects } from "@/server/projects/public-projects";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore published digital products and collaborative work from the A&A team.",
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Projects | A&A Portfolio",
    description: "Explore published digital products and collaborative work from the A&A team.",
    url: "/projects",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | A&A Portfolio",
    description: "Explore published digital products and collaborative work from the A&A team.",
  },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]/70">
      <PublicHeader />
      <main className="mx-auto w-[min(calc(100%-2rem),80rem)] py-14 sm:py-20">
        <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Selected work</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.06em] sm:text-7xl">Projects</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">Published products, experiments, and collaborations from across the team.</p>
          </div>
          <p className="text-sm text-white/35">{projects.length} published project{projects.length === 1 ? "" : "s"}</p>
        </div>

        {projects.length ? (
          <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Published projects">
            {projects.map((project, index) => <ProjectCard eager={index < 3} key={project.slug} project={project} />)}
          </section>
        ) : (
          <section className="mt-12 rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">Projects are being prepared</h2>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-white/50">Published team work will appear here. Meet the people behind it while the first case studies are prepared.</p>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
