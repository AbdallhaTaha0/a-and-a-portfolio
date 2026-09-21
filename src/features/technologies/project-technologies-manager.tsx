"use client";

import { useActionState } from "react";
import { assignProjectTechnology, removeProjectTechnology, type TechnologyActionState } from "@/features/technologies/technology-actions";

type Technology = { id: string; name: string; category: string | null };
const initialState: TechnologyActionState = { status: "idle", message: "" };
function Message({ state }: { state: TechnologyActionState }) { return state.message ? <p aria-live="polite" className={`mt-3 text-sm ${state.status === "success" ? "text-emerald-200" : "text-red-200"}`}>{state.message}</p> : null; }
function TechnologyChip({ projectId, technology }: { projectId: string; technology: Technology }) {
  const [state, action, pending] = useActionState(removeProjectTechnology, initialState);
  return <div><form action={action} onSubmit={(event) => { if (!window.confirm(`Remove ${technology.name} from this project?`)) event.preventDefault(); }}><input name="projectId" type="hidden" value={projectId} /><input name="technologyId" type="hidden" value={technology.id} /><button className="min-h-10 rounded-full border border-white/15 px-4 text-sm text-white/70 hover:border-red-400/35 hover:text-red-200 disabled:opacity-50" disabled={pending} type="submit">{pending ? "Removing…" : `${technology.name} ×`}</button></form><Message state={state} /></div>;
}
export function ProjectTechnologiesManager({ projectId, assigned, technologies }: { projectId: string; assigned: Technology[]; technologies: Technology[] }) {
  const [state, action, pending] = useActionState(assignProjectTechnology, initialState);
  const assignedIds = new Set(assigned.map((technology) => technology.id));
  const available = technologies.filter((technology) => !assignedIds.has(technology.id));
  return <section className="mt-10" aria-labelledby="project-technologies-heading"><p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Stack</p><h2 className="mt-2 text-2xl font-bold" id="project-technologies-heading">Technologies</h2>
    {available.length ? <form action={action} className="mt-5 flex flex-wrap items-end gap-3 rounded-3xl border border-white/10 bg-white/[0.035] p-5"><input name="projectId" type="hidden" value={projectId} /><label className="min-w-64 flex-1"><span className="mb-2 block text-sm font-semibold text-white/75">Technology</span><select className="min-h-11 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-sm" disabled={pending} name="technologyId" required><option value="">Choose a technology</option>{available.map((technology) => <option key={technology.id} value={technology.id}>{technology.name}{technology.category ? ` — ${technology.category}` : ""}</option>)}</select></label><button className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-[#080808] disabled:opacity-50" disabled={pending} type="submit">{pending ? "Assigning…" : "Assign technology"}</button><div className="w-full"><Message state={state} /></div></form> : technologies.length ? <p className="mt-5 text-sm text-white/45">Every technology is already assigned.</p> : <p className="mt-5 text-sm text-white/45">Create technologies in the dictionary before assigning them.</p>}
    {assigned.length ? <div className="mt-5 flex flex-wrap gap-3">{assigned.map((technology) => <TechnologyChip key={technology.id} projectId={projectId} technology={technology} />)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-sm text-white/45">No technologies assigned.</p>}
  </section>;
}
