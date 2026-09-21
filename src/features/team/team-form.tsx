"use client";

import { useActionState } from "react";

import {
  type TeamContentActionState,
  updateTeamContent,
} from "@/features/team/team-actions";

type EditableTeam = {
  name: string;
  shortDescription: string | null;
  description: string | null;
  contactEmail: string | null;
  location: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
};

const initialState: TeamContentActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-12 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;

  return (
    <p className="mt-2 text-sm text-red-300" role="alert">
      {errors[0]}
    </p>
  );
}

export function TeamContentForm({ team }: { team: EditableTeam }) {
  const [state, formAction, pending] = useActionState(
    updateTeamContent,
    initialState,
  );

  return (
    <form action={formAction} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Team name</span>
            <input className={inputClassName} defaultValue={team.name} disabled={pending} maxLength={160} name="name" required />
            <FieldError errors={state.fieldErrors?.name} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">Hero introduction</span>
            <textarea className={`${inputClassName} min-h-28 resize-y py-3`} defaultValue={team.shortDescription ?? ""} disabled={pending} maxLength={320} name="shortDescription" placeholder="A concise statement shown beneath the main headline." />
            <span className="mt-2 block text-xs text-white/40">Up to 320 characters.</span>
            <FieldError errors={state.fieldErrors?.shortDescription} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">About the team</span>
            <textarea className={`${inputClassName} min-h-44 resize-y py-3`} defaultValue={team.description ?? ""} disabled={pending} maxLength={4000} name="description" placeholder="Describe the team, its focus, and the work it wants to be known for." />
            <span className="mt-2 block text-xs text-white/40">Plain text, up to 4,000 characters.</span>
            <FieldError errors={state.fieldErrors?.description} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Public contact email</span>
            <input className={inputClassName} defaultValue={team.contactEmail ?? ""} disabled={pending} maxLength={320} name="contactEmail" placeholder="hello@example.com" type="email" />
            <FieldError errors={state.fieldErrors?.contactEmail} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">Location</span>
            <input className={inputClassName} defaultValue={team.location ?? ""} disabled={pending} maxLength={160} name="location" placeholder="Cairo, Egypt" />
            <FieldError errors={state.fieldErrors?.location} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">GitHub URL</span>
            <input className={inputClassName} defaultValue={team.githubUrl ?? ""} disabled={pending} inputMode="url" name="githubUrl" placeholder="https://github.com/…" type="url" />
            <FieldError errors={state.fieldErrors?.githubUrl} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">LinkedIn URL</span>
            <input className={inputClassName} defaultValue={team.linkedinUrl ?? ""} disabled={pending} inputMode="url" name="linkedinUrl" placeholder="https://linkedin.com/company/…" type="url" />
            <FieldError errors={state.fieldErrors?.linkedinUrl} />
          </label>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6">
          <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">Publishes immediately</p>
          <p className="mt-3 text-sm leading-6 text-white/55">Saving updates the public home page. Empty optional fields are hidden from visitors.</p>
        </div>

        {state.message ? (
          <p aria-live="polite" className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
            {state.message}
          </p>
        ) : null}

        <button className="min-h-12 w-full cursor-pointer rounded-full bg-[#ffb800] px-5 font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Saving…" : "Save team content"}
        </button>
      </aside>
    </form>
  );
}
