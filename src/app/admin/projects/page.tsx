import Link from "next/link";

import { ProjectForm } from "@/features/projects/project-form";
import { getAdminProjects } from "@/server/admin/projects";
import { requireTeamAdmin } from "@/server/auth/current-user";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ projectDeleted?: string }> }) {
  await requireTeamAdmin();
  const [projects, query] = await Promise.all([getAdminProjects(), searchParams]);

  return (
    <div>
      <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin">← Team dashboard</Link>
      <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Team administration</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Projects</h1>
      <p className="mt-3 max-w-3xl leading-7 text-white/55">Create project drafts, manage publication and featured state, and control editorial ordering.</p>

      {query.projectDeleted === "1" ? <p className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100" role="status">Project deleted. Its audit history was retained.</p> : null}

      <details className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-6 open:border-white/20 sm:p-8">
        <summary className="cursor-pointer text-xl font-bold">Create a project</summary>
        <p className="mb-7 mt-2 text-sm leading-6 text-white/45">New projects start as drafts unless all publication requirements are supplied.</p>
        <ProjectForm />
      </details>

      <section className="mt-12" aria-labelledby="project-list-heading">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Editorial collection</p><h2 className="mt-2 text-2xl font-bold" id="project-list-heading">{projects.length} project{projects.length === 1 ? "" : "s"}</h2></div><p className="text-xs text-white/35">Ordered by display order</p></div>
        {projects.length ? <div className="mt-5 grid gap-3">{projects.map((project) => (
          <article className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={project.id}>
            <span className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/55" aria-label={`Display order ${project.sortOrder}`}>{project.sortOrder}</span>
            <div className="min-w-0"><h3 className="truncate font-semibold text-white/85">{project.title}</h3><p className="mt-1 truncate text-sm text-white/45">{project.shortDescription ?? "No short description yet"}</p><div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-semibold tracking-[0.06em] uppercase"><span className={`rounded-full border px-2.5 py-1 ${project.isPublished ? "border-emerald-400/25 text-emerald-200" : "border-white/10 text-white/45"}`}>{project.isPublished ? "Published" : "Draft"}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-white/45">{project.status.replace("_", " ")}</span>{project.isFeatured ? <span className="rounded-full border border-[#ffb800]/25 px-2.5 py-1 text-[#ffc83d]">Featured</span> : null}<span className="rounded-full border border-white/10 px-2.5 py-1 text-white/35">{project._count.members} members · {project._count.technologies} technologies</span></div></div>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#ffb800]/35 px-5 text-sm font-semibold text-[#ffc83d] transition hover:bg-[#ffb800]/10" href={`/admin/projects/${project.id}`}>View and edit</Link>
          </article>
        ))}</div> : <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><h3 className="font-semibold text-white/80">No projects yet</h3><p className="mt-2 text-sm text-white/45">Create the first project draft above.</p></div>}
      </section>
    </div>
  );
}
