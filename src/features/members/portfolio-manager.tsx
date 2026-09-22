"use client";

import { useActionState } from "react";

import { ImageUploadForm } from "@/features/media/image-upload-form";
import {
  createPortfolioEntry,
  deletePortfolioEntry,
  updatePortfolioEntry,
  type PortfolioActionState,
} from "@/features/members/portfolio-actions";
import type {
  PortfolioItem,
  PortfolioKind,
} from "@/features/members/portfolio-schema";

const initialState: PortfolioActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

const labels: Record<PortfolioKind, { singular: string; plural: string }> = {
  skills: { singular: "skill", plural: "skills" },
  certifications: { singular: "certification", plural: "certifications" },
  achievements: { singular: "achievement", plural: "achievements" },
  projects: { singular: "personal project", plural: "personal projects" },
  links: { singular: "social link", plural: "social links" },
};

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <span className="mt-2 block text-xs text-red-300" role="alert">
      {errors[0]}
    </span>
  ) : null;
}

function ActionMessage({ state }: { state: PortfolioActionState }) {
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

function TextField({
  label,
  name,
  state,
  defaultValue,
  maxLength,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  name: string;
  state: PortfolioActionState;
  defaultValue?: string | number | null;
  maxLength?: number;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "url" | "date" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-white/75">{label}</span>
      <input
        className={inputClassName}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
        {...(type === "number" ? { min: 1, max: 100 } : {})}
      />
      <FieldError errors={state.fieldErrors?.[name]} />
    </label>
  );
}

function TextArea({
  label,
  name,
  state,
  defaultValue,
  maxLength,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  state: PortfolioActionState;
  defaultValue?: string | null;
  maxLength: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-2 block text-sm font-semibold text-white/75">{label}</span>
      <textarea
        className={`${inputClassName} min-h-28 resize-y py-3`}
        defaultValue={defaultValue ?? ""}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        required={required}
      />
      <FieldError errors={state.fieldErrors?.[name]} />
    </label>
  );
}

function EntryFields({
  kind,
  item,
  pending,
  state,
}: {
  kind: PortfolioKind;
  item?: PortfolioItem;
  pending: boolean;
  state: PortfolioActionState;
}) {
  const editing = Boolean(item);

  return (
    <fieldset className="grid gap-5 sm:grid-cols-2" disabled={pending}>
      {kind === "skills" ? (
        <>
          {editing ? (
            <div className="sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="font-semibold">{item?.name}</p>
              {item?.category ? <p className="mt-1 text-xs text-white/40">{item.category}</p> : null}
            </div>
          ) : (
            <>
              <TextField label="Skill name" maxLength={120} name="name" placeholder="TypeScript" required state={state} />
              <TextField label="Category" maxLength={120} name="category" placeholder="Frontend" state={state} />
            </>
          )}
          <TextField defaultValue={item?.proficiency} label="Proficiency (1–100)" name="proficiency" placeholder="85" state={state} type="number" />
        </>
      ) : null}

      {kind === "certifications" ? (
        <>
          <TextField defaultValue={item?.name} label="Certification" maxLength={200} name="name" placeholder="Professional certification" required state={state} />
          <TextField defaultValue={item?.issuer} label="Issuer" maxLength={200} name="issuer" placeholder="Issuing organization" required state={state} />
          <TextField defaultValue={item?.issueDate} label="Issue date" name="issueDate" required state={state} type="date" />
          <TextField defaultValue={item?.expirationDate} label="Expiration date" name="expirationDate" state={state} type="date" />
          <TextField defaultValue={item?.credentialUrl} label="Credential URL" name="credentialUrl" placeholder="https://…" state={state} type="url" />
          <TextArea defaultValue={item?.description} label="Description" maxLength={4000} name="description" placeholder="What this certification demonstrates" state={state} />
        </>
      ) : null}

      {kind === "achievements" ? (
        <>
          <TextField defaultValue={item?.title} label="Title" maxLength={200} name="title" placeholder="Achievement title" required state={state} />
          <TextField defaultValue={item?.issuer} label="Issuer" maxLength={200} name="issuer" placeholder="Organization (optional)" state={state} />
          <TextField defaultValue={item?.date} label="Date" name="date" state={state} type="date" />
          <TextField defaultValue={item?.url} label="Reference URL" name="url" placeholder="https://…" state={state} type="url" />
          <TextArea defaultValue={item?.description} label="Description" maxLength={4000} name="description" placeholder="Describe the achievement and its significance" required state={state} />
        </>
      ) : null}

      {kind === "projects" ? (
        <>
          <TextField defaultValue={item?.title} label="Title" maxLength={200} name="title" placeholder="Project title" required state={state} />
          <TextField defaultValue={item?.slug} label="Slug" maxLength={120} name="slug" placeholder="project-name" required state={state} />
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/75">Short description</span>
            <input className={inputClassName} defaultValue={item?.shortDescription ?? ""} maxLength={320} name="shortDescription" placeholder="A concise project summary" />
            <FieldError errors={state.fieldErrors?.shortDescription} />
          </label>
          <TextArea defaultValue={item?.description} label="Full description" maxLength={10000} name="description" placeholder="Describe the problem, process, and outcome" state={state} />
          <TextField defaultValue={item?.thumbnailUrl} label="Thumbnail URL" name="thumbnailUrl" placeholder="https://…" state={state} type="url" />
          <TextField defaultValue={item?.githubUrl} label="GitHub URL" name="githubUrl" placeholder="https://github.com/…" state={state} type="url" />
          <TextField defaultValue={item?.liveUrl} label="Live URL" name="liveUrl" placeholder="https://…" state={state} type="url" />
          <div />
          <TextField defaultValue={item?.startDate} label="Start date" name="startDate" state={state} type="date" />
          <TextField defaultValue={item?.endDate} label="End date" name="endDate" state={state} type="date" />
          <label className="flex cursor-pointer items-start gap-3">
            <input className="mt-1 size-4 accent-[#ffb800]" defaultChecked={item?.isFeatured ?? false} name="isFeatured" type="checkbox" />
            <span className="text-sm font-semibold text-white/75">Feature this project</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input className="mt-1 size-4 accent-[#ffb800]" defaultChecked={item?.isPublished ?? false} name="isPublished" type="checkbox" />
            <span>
              <span className="block text-sm font-semibold text-white/75">Publish this project</span>
              <span className="mt-1 block text-xs text-white/40">Requires short and full descriptions.</span>
            </span>
          </label>
        </>
      ) : null}

      {kind === "links" ? (
        <>
          <TextField defaultValue={item?.platform} label="Platform" maxLength={80} name="platform" placeholder="GitHub" required state={state} />
          <TextField defaultValue={item?.url} label="Profile URL" name="url" placeholder="https://…" required state={state} type="url" />
        </>
      ) : null}
    </fieldset>
  );
}

function CreateEntryForm({ kind }: { kind: PortfolioKind }) {
  const [state, formAction, pending] = useActionState(
    createPortfolioEntry.bind(null, kind),
    initialState,
  );
  return (
    <form action={formAction} className="space-y-6">
      <EntryFields kind={kind} pending={pending} state={state} />
      <ActionMessage state={state} />
      <button className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Adding…" : `Add ${labels[kind].singular}`}
      </button>
    </form>
  );
}

function itemTitle(kind: PortfolioKind, item: PortfolioItem) {
  if (kind === "achievements" || kind === "projects") return item.title;
  if (kind === "links") return item.platform;
  return item.name;
}

function itemSubtitle(kind: PortfolioKind, item: PortfolioItem) {
  if (kind === "skills") return item.category ?? "Uncategorized";
  if (kind === "certifications") return item.issuer;
  if (kind === "achievements") return item.issuer ?? "Personal achievement";
  if (kind === "projects") return item.isPublished ? "Published" : "Draft";
  return item.url;
}

function EditEntry({ kind, item }: { kind: PortfolioKind; item: PortfolioItem }) {
  const [updateState, updateAction, updating] = useActionState(
    updatePortfolioEntry.bind(null, kind, item.id),
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deletePortfolioEntry.bind(null, kind, item.id),
    initialState,
  );

  return (
    <details className="group rounded-2xl border border-white/10 bg-white/[0.025] open:border-white/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ffb800]">
        <span className="min-w-0">
          <span className="block truncate font-semibold text-white/85">{itemTitle(kind, item)}</span>
          <span className="mt-1 block truncate text-sm text-white/45">{itemSubtitle(kind, item)}</span>
        </span>
        <span className="text-sm font-semibold text-[#ffc83d] group-open:hidden">Edit</span>
        <span className="hidden text-sm font-semibold text-white/45 group-open:inline">Close</span>
      </summary>
      <div className="border-t border-white/10 p-5 sm:p-6">
        <form action={updateAction} className="space-y-6">
          <EntryFields item={item} kind={kind} pending={updating} state={updateState} />
          <ActionMessage state={updateState} />
          <button className="min-h-11 cursor-pointer rounded-full bg-white px-6 text-sm font-bold text-[#080808] transition hover:bg-white/85 disabled:cursor-wait disabled:opacity-60" disabled={updating} type="submit">
            {updating ? "Saving…" : "Save changes"}
          </button>
        </form>
        {kind === "projects" ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <ImageUploadForm currentUrl={item.thumbnailUrl} recordId={item.id} target="personal-project-thumbnail" title="Project thumbnail" />
          </div>
        ) : null}
        <form
          action={deleteAction}
          className="mt-6 border-t border-white/10 pt-6"
          onSubmit={(event) => {
            if (!window.confirm(`Remove this ${labels[kind].singular}? This cannot be undone.`)) event.preventDefault();
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

export function PortfolioManager({
  kind,
  items,
}: {
  kind: PortfolioKind;
  items: PortfolioItem[];
}) {
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-start">
      <section aria-labelledby="portfolio-existing-heading">
        <p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Your entries</p>
        <h2 className="mt-2 text-2xl font-bold" id="portfolio-existing-heading">
          {items.length ? `${items.length} saved` : "Nothing added yet"}
        </h2>
        {items.length ? (
          <div className="mt-5 space-y-3">
            {items.map((item) => <EditEntry item={item} key={item.id} kind={kind} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-sm leading-6 text-white/45">
            Add your first {labels[kind].singular} using the form.
          </div>
        )}
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7" aria-labelledby="portfolio-new-heading">
        <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">New entry</p>
        <h2 className="mb-6 mt-2 text-2xl font-bold" id="portfolio-new-heading">Add {labels[kind].singular}</h2>
        <CreateEntryForm kind={kind} />
      </section>
    </div>
  );
}
