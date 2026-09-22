import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageUploadForm, ProjectGalleryManager } from "@/features/media/image-upload-form";
import { DeleteProjectForm, ProjectForm } from "@/features/projects/project-form";
import { ProjectMembersManager } from "@/features/projects/project-members-manager";
import { ProjectTechnologiesManager } from "@/features/technologies/project-technologies-manager";
import { getAdminProjectById, getProjectMemberCandidates } from "@/server/admin/projects";
import { getAdminTechnologies } from "@/server/admin/technologies";
import { requireTeamAdmin } from "@/server/auth/current-user";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
const inputDate = (date: Date | null) => date?.toISOString().slice(0, 10) ?? "";

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireTeamAdmin();
  const { projectId } = await params;
  const [project, memberCandidates, technologyCandidates] = await Promise.all([
    getAdminProjectById(projectId),
    getProjectMemberCandidates(),
    getAdminTechnologies(),
  ]);
  if (!project) notFound();

  return (
    <div>
      <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin/projects">← Projects</Link>
      <div className="mt-8 flex flex-wrap items-start justify-between gap-5"><div><p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Complete project record</p><h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{project.title}</h1><p className="mt-3 text-sm text-white/50">Created {dateFormat.format(project.createdAt)} · Updated {dateFormat.format(project.updatedAt)}</p></div><div className="flex flex-wrap gap-2 text-xs font-semibold tracking-[0.06em] uppercase"><span className="rounded-full border border-white/10 px-3 py-1.5 text-white/60">{project.status.replace("_", " ")}</span><span className={`rounded-full border px-3 py-1.5 ${project.isPublished ? "border-emerald-400/25 text-emerald-200" : "border-white/10 text-white/45"}`}>{project.isPublished ? "Published" : "Draft"}</span></div></div>
      <div className="mt-6 flex flex-wrap gap-3"><Link className="inline-flex min-h-11 items-center rounded-full border border-[#ffb800]/35 px-5 text-sm font-semibold text-[#ffc83d] transition hover:bg-[#ffb800]/10" href={`/admin/projects/${project.id}/preview`}>Preview saved page</Link>{project.isPublished ? <Link className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/65 transition hover:border-white/30 hover:text-white" href={`/projects/${project.slug}`}>View public page</Link> : null}</div>
      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Project relationships"><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-xs text-white/40">Assigned members</p><p className="mt-1 text-xl font-bold">{project._count.members}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-xs text-white/40">Technologies</p><p className="mt-1 text-xl font-bold">{project._count.technologies}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="text-xs text-white/40">Gallery images</p><p className="mt-1 text-xl font-bold">{project._count.images}</p></div></section>
      <div className="mt-8"><ProjectForm project={{ id: project.id, title: project.title, slug: project.slug, shortDescription: project.shortDescription, description: project.description, thumbnailUrl: project.thumbnailUrl, githubUrl: project.githubUrl, liveUrl: project.liveUrl, status: project.status, startDate: inputDate(project.startDate), endDate: inputDate(project.endDate), isFeatured: project.isFeatured, isPublished: project.isPublished, sortOrder: project.sortOrder }} /></div>
      <div className="mt-10 max-w-xl"><ImageUploadForm currentUrl={project.thumbnailUrl} recordId={project.id} target="team-project-thumbnail" title="Project thumbnail" /></div>
      <ProjectGalleryManager images={project.images} projectId={project.id} />
      <ProjectMembersManager assignments={project.members} candidates={memberCandidates} projectId={project.id} />
      <ProjectTechnologiesManager
        assigned={project.technologies.map(({ technology }) => technology)}
        projectId={project.id}
        technologies={technologyCandidates.map(({ id, name, category }) => ({ id, name, category }))}
      />
      <DeleteProjectForm projectId={project.id} slug={project.slug} />
    </div>
  );
}
