"use client";

import { useActionState, useState } from "react";

import {
  createProject,
  deleteProject,
  type ProjectActionState,
  updateProject,
} from "@/features/projects/project-actions";

type EditableProject = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
};

const initialState: ProjectActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-12 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <span className="mt-2 block text-sm text-red-300" role="alert">{errors[0]}</span>
  ) : null;
}

function ResultMessage({ state }: { state: ProjectActionState }) {
  return state.message ? (
    <p aria-live="polite" className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
      {state.message}
    </p>
  ) : null;
}

export function ProjectForm({ project }: { project?: EditableProject }) {
  const action = project ? updateProject : createProject;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      {project ? <input name="projectId" type="hidden" value={project.id} /> : null}
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Project title</span>
            <input className={inputClassName} defaultValue={project?.title ?? ""} disabled={pending} maxLength={200} name="title" required />
            <FieldError errors={state.fieldErrors?.title} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Public slug</span>
            <input className={inputClassName} defaultValue={project?.slug ?? ""} disabled={pending} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="project-name" required />
            <FieldError errors={state.fieldErrors?.slug} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Display order</span>
            <input className={inputClassName} defaultValue={project?.sortOrder ?? 0} disabled={pending} max={1_000_000} min={0} name="sortOrder" required step={1} type="number" />
            <FieldError errors={state.fieldErrors?.sortOrder} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Short description</span>
            <textarea className={`${inputClassName} min-h-24 resize-y py-3`} defaultValue={project?.shortDescription ?? ""} disabled={pending} maxLength={320} name="shortDescription" />
            <FieldError errors={state.fieldErrors?.shortDescription} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Full description</span>
            <textarea className={`${inputClassName} min-h-48 resize-y py-3`} defaultValue={project?.description ?? ""} disabled={pending} maxLength={10_000} name="description" />
            <FieldError errors={state.fieldErrors?.description} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Thumbnail URL</span>
            <input className={inputClassName} defaultValue={project?.thumbnailUrl ?? ""} disabled={pending} name="thumbnailUrl" type="url" />
            <FieldError errors={state.fieldErrors?.thumbnailUrl} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">GitHub URL</span>
            <input className={inputClassName} defaultValue={project?.githubUrl ?? ""} disabled={pending} name="githubUrl" type="url" />
            <FieldError errors={state.fieldErrors?.githubUrl} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Live site URL</span>
            <input className={inputClassName} defaultValue={project?.liveUrl ?? ""} disabled={pending} name="liveUrl" type="url" />
            <FieldError errors={state.fieldErrors?.liveUrl} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Start date</span>
            <input className={inputClassName} defaultValue={project?.startDate ?? ""} disabled={pending} name="startDate" type="date" />
            <FieldError errors={state.fieldErrors?.startDate} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">End date</span>
            <input className={inputClassName} defaultValue={project?.endDate ?? ""} disabled={pending} name="endDate" type="date" />
            <FieldError errors={state.fieldErrors?.endDate} />
          </label>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <label className="block rounded-3xl border border-white/10 bg-[#111] p-6">
          <span className="mb-2 block text-sm font-semibold text-white/80">Project status</span>
          <select className={inputClassName} defaultValue={project?.status ?? "PLANNING"} disabled={pending} name="status">
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <FieldError errors={state.fieldErrors?.status} />
        </label>
        <label className="flex cursor-pointer gap-3 rounded-3xl border border-white/10 bg-[#111] p-6">
          <input className="mt-1 size-4 accent-[#ffb800]" defaultChecked={project?.isFeatured ?? false} disabled={pending} name="isFeatured" type="checkbox" />
          <span><span className="block font-semibold">Featured project</span><span className="mt-1 block text-sm leading-5 text-white/45">Prioritize this work in featured collections.</span></span>
        </label>
        <label className="flex cursor-pointer gap-3 rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6">
          <input className="mt-1 size-4 accent-[#ffb800]" defaultChecked={project?.isPublished ?? false} disabled={pending} name="isPublished" type="checkbox" />
          <span><span className="block font-semibold">Publish project</span><span className="mt-1 block text-sm leading-5 text-white/50">Requires both descriptions and a thumbnail.</span></span>
        </label>
        <ResultMessage state={state} />
        <button className="min-h-12 w-full cursor-pointer rounded-full bg-[#ffb800] px-5 font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Saving…" : project ? "Save project" : "Create project"}
        </button>
      </aside>
    </form>
  );
}

export function DeleteProjectForm({ projectId, slug }: { projectId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(deleteProject, initialState);
  const [confirmation, setConfirmation] = useState("");

  return (
    <form action={formAction} className="mt-8 rounded-3xl border border-red-400/25 bg-red-400/5 p-6 sm:p-8" onSubmit={(event) => {
      if (!window.confirm("Permanently delete this project and its assignments, technology links, and gallery records?")) event.preventDefault();
    }}>
      <input name="projectId" type="hidden" value={projectId} />
      <p className="text-xs font-bold tracking-[0.14em] text-red-200 uppercase">Destructive action</p>
      <h2 className="mt-2 text-2xl font-bold">Delete project</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">The project and its owned relationship records are permanently removed. Audit history remains.</p>
      <label className="mt-6 block max-w-xl">
        <span className="mb-2 block text-sm font-semibold text-white/80">Type <strong>{slug}</strong> to confirm</span>
        <input autoComplete="off" className={inputClassName} disabled={pending} maxLength={120} name="confirmation" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} />
        <FieldError errors={state.fieldErrors?.confirmation} />
      </label>
      <ResultMessage state={state} />
      <button className="mt-5 min-h-12 cursor-pointer rounded-full bg-red-500 px-6 font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40" disabled={pending || confirmation !== slug} type="submit">
        {pending ? "Deleting…" : "Permanently delete project"}
      </button>
    </form>
  );
}
