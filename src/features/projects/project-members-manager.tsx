"use client";

import { useActionState } from "react";

import {
  type ProjectMemberActionState,
  removeProjectMember,
  saveProjectMember,
} from "@/features/projects/project-member-actions";

type Candidate = {
  id: string;
  fullName: string;
  slug: string;
  isPublished: boolean;
  user: { isActive: boolean };
};

type Assignment = {
  role: string | null;
  contribution: string | null;
  member: Candidate;
};

const initialState: ProjectMemberActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-sm text-white outline-none transition focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:opacity-60";

function Message({ state }: { state: ProjectMemberActionState }) {
  return state.message ? (
    <p aria-live="polite" className={`mt-3 text-sm ${state.status === "success" ? "text-emerald-200" : "text-red-200"}`}>{state.message}</p>
  ) : null;
}

function AssignmentRow({ projectId, assignment }: { projectId: string; assignment: Assignment }) {
  const [saveState, saveAction, savePending] = useActionState(saveProjectMember, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeProjectMember, initialState);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold text-white/85">{assignment.member.fullName}</h3><p className="mt-1 text-xs text-white/40">/members/{assignment.member.slug}{!assignment.member.user.isActive ? " · inactive account" : ""}</p></div>
        <span className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold uppercase ${assignment.member.isPublished ? "border-emerald-400/25 text-emerald-200" : "border-white/10 text-white/45"}`}>{assignment.member.isPublished ? "Published profile" : "Draft profile"}</span>
      </div>
      <form action={saveAction} className="mt-5 grid gap-4 sm:grid-cols-2">
        <input name="projectId" type="hidden" value={projectId} />
        <input name="memberId" type="hidden" value={assignment.member.id} />
        <label><span className="mb-2 block text-xs font-semibold text-white/60">Project role</span><input className={inputClassName} defaultValue={assignment.role ?? ""} disabled={savePending} maxLength={160} name="role" /></label>
        <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-white/60">Contribution</span><textarea className={`${inputClassName} min-h-24 resize-y py-3`} defaultValue={assignment.contribution ?? ""} disabled={savePending} maxLength={4_000} name="contribution" /></label>
        <button className="min-h-11 rounded-full border border-[#ffb800]/35 px-5 text-sm font-semibold text-[#ffc83d] disabled:opacity-50 sm:justify-self-start" disabled={savePending} type="submit">{savePending ? "Saving…" : "Save assignment"}</button>
      </form>
      <Message state={saveState} />
      <form action={removeAction} className="mt-4 border-t border-white/10 pt-4" onSubmit={(event) => { if (!window.confirm(`Remove ${assignment.member.fullName} from this project?`)) event.preventDefault(); }}>
        <input name="projectId" type="hidden" value={projectId} />
        <input name="memberId" type="hidden" value={assignment.member.id} />
        <button className="min-h-10 rounded-full border border-red-400/25 px-4 text-xs font-semibold text-red-200 disabled:opacity-50" disabled={removePending} type="submit">{removePending ? "Removing…" : "Remove from project"}</button>
      </form>
      <Message state={removeState} />
    </article>
  );
}

export function ProjectMembersManager({ projectId, assignments, candidates }: { projectId: string; assignments: Assignment[]; candidates: Candidate[] }) {
  const [state, action, pending] = useActionState(saveProjectMember, initialState);
  const assignedIds = new Set(assignments.map((assignment) => assignment.member.id));
  const unassigned = candidates.filter((candidate) => !assignedIds.has(candidate.id));

  return (
    <section className="mt-10" aria-labelledby="project-members-heading">
      <div><p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Contributors</p><h2 className="mt-2 text-2xl font-bold" id="project-members-heading">Project members</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Participation does not grant permission to edit the team project.</p></div>
      {unassigned.length ? (
        <form action={action} className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-2 sm:p-6">
          <input name="projectId" type="hidden" value={projectId} />
          <label><span className="mb-2 block text-sm font-semibold text-white/75">Member</span><select className={inputClassName} disabled={pending} name="memberId" required><option value="">Choose a Member profile</option>{unassigned.map((member) => <option key={member.id} value={member.id}>{member.fullName}{!member.user.isActive ? " (inactive)" : ""}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-semibold text-white/75">Project role</span><input className={inputClassName} disabled={pending} maxLength={160} name="role" placeholder="Designer, engineer, lead…" /></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-white/75">Contribution</span><textarea className={`${inputClassName} min-h-24 resize-y py-3`} disabled={pending} maxLength={4_000} name="contribution" /></label>
          <div className="sm:col-span-2"><Message state={state} /></div>
          <button className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-[#080808] disabled:opacity-50 sm:justify-self-start" disabled={pending} type="submit">{pending ? "Assigning…" : "Assign member"}</button>
        </form>
      ) : candidates.length ? <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm text-white/45">Every Member profile is already assigned to this project.</p> : <p className="mt-6 rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/45">No Member profiles exist yet. Create a profile before assigning project contributors.</p>}
      {assignments.length ? <div className="mt-5 grid gap-3">{assignments.map((assignment) => <AssignmentRow assignment={assignment} key={assignment.member.id} projectId={projectId} />)}</div> : <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><h3 className="font-semibold text-white/80">No assigned members</h3><p className="mt-2 text-sm text-white/45">Use the form above to add the first contributor.</p></div>}
    </section>
  );
}
