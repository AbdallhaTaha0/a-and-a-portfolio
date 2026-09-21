"use client";

import { useActionState } from "react";

import {
  createEducation,
  createExperience,
  deleteEducation,
  deleteExperience,
  type TimelineActionState,
  updateEducation,
  updateExperience,
} from "@/features/members/timeline-actions";

type TimelineKind = "education" | "experience";

type TimelineItem = {
  id: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  company?: string;
  position?: string;
};

const initialState: TimelineActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <span className="mt-2 block text-xs text-red-300" role="alert">
      {errors[0]}
    </span>
  ) : null;
}

function ActionMessage({ state }: { state: TimelineActionState }) {
  if (!state.message) return null;

  return (
    <p
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}
    >
      {state.message}
    </p>
  );
}

function EntryFields({
  item,
  kind,
  pending,
  state,
}: {
  item?: TimelineItem;
  kind: TimelineKind;
  pending: boolean;
  state: TimelineActionState;
}) {
  return (
    <fieldset className="grid gap-5 sm:grid-cols-2" disabled={pending}>
      {kind === "education" ? (
        <>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/75">Institution</span>
            <input className={inputClassName} defaultValue={item?.institution ?? ""} maxLength={200} name="institution" placeholder="University or learning provider" required />
            <FieldError errors={state.fieldErrors?.institution} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Degree</span>
            <input className={inputClassName} defaultValue={item?.degree ?? ""} maxLength={160} name="degree" placeholder="Bachelor of Science" required />
            <FieldError errors={state.fieldErrors?.degree} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Field of study</span>
            <input className={inputClassName} defaultValue={item?.fieldOfStudy ?? ""} maxLength={160} name="fieldOfStudy" placeholder="Computer Science" required />
            <FieldError errors={state.fieldErrors?.fieldOfStudy} />
          </label>
        </>
      ) : (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Company</span>
            <input className={inputClassName} defaultValue={item?.company ?? ""} maxLength={200} name="company" placeholder="Company or organization" required />
            <FieldError errors={state.fieldErrors?.company} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/75">Position</span>
            <input className={inputClassName} defaultValue={item?.position ?? ""} maxLength={160} name="position" placeholder="Frontend engineer" required />
            <FieldError errors={state.fieldErrors?.position} />
          </label>
        </>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Start date</span>
        <input className={inputClassName} defaultValue={item?.startDate ?? ""} name="startDate" required type="date" />
        <FieldError errors={state.fieldErrors?.startDate} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">End date</span>
        <input className={inputClassName} defaultValue={item?.endDate ?? ""} name="endDate" type="date" />
        <FieldError errors={state.fieldErrors?.endDate} />
      </label>
      <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
        <input className="mt-1 size-4 accent-[#ffb800]" defaultChecked={item?.isCurrent ?? false} name="isCurrent" type="checkbox" />
        <span>
          <span className="block text-sm font-semibold text-white/75">This is current</span>
          <span className="mt-1 block text-xs text-white/40">The end date is ignored while this option is selected.</span>
        </span>
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-white/75">Description</span>
        <textarea className={`${inputClassName} min-h-28 resize-y py-3`} defaultValue={item?.description ?? ""} maxLength={4000} name="description" placeholder="Add relevant details, outcomes, or focus areas." />
        <FieldError errors={state.fieldErrors?.description} />
      </label>
    </fieldset>
  );
}

function CreateEntryForm({ kind }: { kind: TimelineKind }) {
  const action = kind === "education" ? createEducation : createExperience;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <EntryFields kind={kind} pending={pending} state={state} />
      <ActionMessage state={state} />
      <button className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Adding…" : `Add ${kind}`}
      </button>
    </form>
  );
}

function EditEntry({ item, kind }: { item: TimelineItem; kind: TimelineKind }) {
  const updateAction = kind === "education" ? updateEducation : updateExperience;
  const removeAction = kind === "education" ? deleteEducation : deleteExperience;
  const [updateState, updateFormAction, updating] = useActionState(
    updateAction.bind(null, item.id),
    initialState,
  );
  const [deleteState, deleteFormAction, deleting] = useActionState(
    removeAction.bind(null, item.id),
    initialState,
  );
  const title = kind === "education" ? item.institution : item.position;
  const subtitle = kind === "education" ? `${item.degree} · ${item.fieldOfStudy}` : item.company;

  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.025] open:border-white/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffb800]">
        <span>
          <span className="block font-semibold text-white/85">{title}</span>
          <span className="mt-1 block text-sm text-white/45">{subtitle}</span>
        </span>
        <span className="text-sm font-semibold text-[#ffc83d] group-open:hidden">Edit</span>
        <span className="hidden text-sm font-semibold text-white/45 group-open:inline">Close</span>
      </summary>

      <div className="border-t border-white/10 p-5 sm:p-6">
        <form action={updateFormAction} className="space-y-6">
          <EntryFields item={item} kind={kind} pending={updating} state={updateState} />
          <ActionMessage state={updateState} />
          <button className="min-h-11 cursor-pointer rounded-full bg-white px-6 text-sm font-bold text-[#080808] transition hover:bg-white/85 disabled:cursor-wait disabled:opacity-60" disabled={updating} type="submit">
            {updating ? "Saving…" : "Save changes"}
          </button>
        </form>

        <form
          action={deleteFormAction}
          className="mt-6 border-t border-white/10 pt-6"
          onSubmit={(event) => {
            if (!window.confirm(`Remove this ${kind} entry? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
        >
          <ActionMessage state={deleteState} />
          <button className="mt-3 min-h-11 cursor-pointer rounded-full border border-red-400/30 px-5 text-sm font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60" disabled={deleting} type="submit">
            {deleting ? "Removing…" : "Remove entry"}
          </button>
        </form>
      </div>
    </details>
  );
}

export function TimelineManager({ items, kind }: { items: TimelineItem[]; kind: TimelineKind }) {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] lg:items-start">
      <section aria-labelledby="existing-entries-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Your entries</p>
            <h2 className="mt-2 text-2xl font-bold" id="existing-entries-heading">{items.length ? `${items.length} saved` : "Nothing added yet"}</h2>
          </div>
        </div>
        {items.length ? (
          <div className="mt-5 space-y-3">
            {items.map((item) => <EditEntry item={item} key={item.id} kind={kind} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-sm leading-6 text-white/45">
            Add your first {kind} entry using the form.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7" aria-labelledby="new-entry-heading">
        <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">New entry</p>
        <h2 className="mb-6 mt-2 text-2xl font-bold" id="new-entry-heading">Add {kind}</h2>
        <CreateEntryForm kind={kind} />
      </section>
    </div>
  );
}
