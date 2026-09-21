"use client";

import { useActionState, useState } from "react";

import { createTechnology, deleteTechnology, type TechnologyActionState, updateTechnology } from "@/features/technologies/technology-actions";

type Technology = { id: string; name: string; category: string | null; iconUrl: string | null; _count: { projects: number } };
const initialState: TechnologyActionState = { status: "idle", message: "" };
const inputClassName = "min-h-11 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-sm text-white outline-none transition focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:opacity-60";
function Message({ state }: { state: TechnologyActionState }) { return state.message ? <p aria-live="polite" className={`mt-3 text-sm ${state.status === "success" ? "text-emerald-200" : "text-red-200"}`}>{state.message}</p> : null; }

function TechnologyRow({ technology }: { technology: Technology }) {
  const [updateState, updateAction, updatePending] = useActionState(updateTechnology, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTechnology, initialState);
  const [confirmation, setConfirmation] = useState("");
  return <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
    <form action={updateAction} className="grid gap-4 sm:grid-cols-2">
      <input name="technologyId" type="hidden" value={technology.id} />
      <label><span className="mb-2 block text-xs font-semibold text-white/60">Name</span><input className={inputClassName} defaultValue={technology.name} disabled={updatePending} maxLength={120} name="name" required /></label>
      <label><span className="mb-2 block text-xs font-semibold text-white/60">Category</span><input className={inputClassName} defaultValue={technology.category ?? ""} disabled={updatePending} maxLength={120} name="category" /></label>
      <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-white/60">Icon URL</span><input className={inputClassName} defaultValue={technology.iconUrl ?? ""} disabled={updatePending} name="iconUrl" type="url" /></label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="min-h-10 rounded-full border border-[#ffb800]/35 px-4 text-xs font-semibold text-[#ffc83d] disabled:opacity-50" disabled={updatePending} type="submit">{updatePending ? "Saving…" : "Save technology"}</button><span className="text-xs text-white/35">Used by {technology._count.projects} project{technology._count.projects === 1 ? "" : "s"}</span></div>
    </form><Message state={updateState} />
    <form action={deleteAction} className="mt-4 border-t border-white/10 pt-4" onSubmit={(event) => { if (!window.confirm(`Permanently delete ${technology.name}?`)) event.preventDefault(); }}>
      <input name="technologyId" type="hidden" value={technology.id} /><label className="block max-w-md"><span className="mb-2 block text-xs text-white/45">Type {technology.name} to delete</span><input className={inputClassName} disabled={deletePending || technology._count.projects > 0} maxLength={120} name="confirmation" onChange={(event) => setConfirmation(event.target.value)} value={confirmation} /></label>
      <button className="mt-3 min-h-10 rounded-full border border-red-400/25 px-4 text-xs font-semibold text-red-200 disabled:opacity-35" disabled={deletePending || technology._count.projects > 0 || confirmation !== technology.name} type="submit">{deletePending ? "Deleting…" : "Delete technology"}</button>
    </form><Message state={deleteState} />
  </article>;
}

export function TechnologyManager({ technologies }: { technologies: Technology[] }) {
  const [state, action, pending] = useActionState(createTechnology, initialState);
  return <>
    <form action={action} className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-2 sm:p-6">
      <label><span className="mb-2 block text-sm font-semibold text-white/75">Name</span><input className={inputClassName} disabled={pending} maxLength={120} name="name" required /></label>
      <label><span className="mb-2 block text-sm font-semibold text-white/75">Category</span><input className={inputClassName} disabled={pending} maxLength={120} name="category" /></label>
      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-white/75">Icon URL</span><input className={inputClassName} disabled={pending} name="iconUrl" type="url" /></label>
      <div className="sm:col-span-2"><Message state={state} /></div><button className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-[#080808] disabled:opacity-50 sm:justify-self-start" disabled={pending} type="submit">{pending ? "Creating…" : "Create technology"}</button>
    </form>
    {technologies.length ? <div className="mt-6 grid gap-3">{technologies.map((technology) => <TechnologyRow key={technology.id} technology={technology} />)}</div> : <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-8 text-center"><h2 className="font-semibold">No technologies yet</h2><p className="mt-2 text-sm text-white/45">Create the first reusable technology above.</p></div>}
  </>;
}
