"use client";

import { useActionState } from "react";

import {
  deleteProjectGalleryImage,
  uploadMedia,
  type MediaActionState,
} from "@/features/media/media-actions";
import { safeHttpsUrl } from "@/lib/urls";

type UploadTarget =
  | "profile"
  | "personal-project-thumbnail"
  | "team-project-thumbnail"
  | "team-project-gallery";

const initialState: MediaActionState = { status: "idle", message: "" };

function ActionMessage({ state }: { state: MediaActionState }) {
  return state.message ? (
    <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
      {state.message}
    </p>
  ) : null;
}

export function ImageUploadForm({ target, recordId, title, currentUrl }: { target: UploadTarget; recordId?: string; title: string; currentUrl?: string | null }) {
  const [state, action, pending] = useActionState(uploadMedia, initialState);
  const gallery = target === "team-project-gallery";
  const safeCurrentUrl = safeHttpsUrl(currentUrl);

  return (
    <form action={action} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <input name="target" type="hidden" value={target} />
      {recordId ? <input name="recordId" type="hidden" value={recordId} /> : null}
      <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">Media</p>
      <h2 className="mt-2 text-xl font-bold">{title}</h2>
      {safeCurrentUrl ? (
        // The URL was produced by validated storage or previously allowlisted input.
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="Current upload" className="mt-5 aspect-video w-full rounded-2xl border border-white/10 object-cover" referrerPolicy="no-referrer" src={safeCurrentUrl} />
      ) : null}
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Image file</span>
        <input accept="image/jpeg,image/png,image/webp" className="block w-full cursor-pointer rounded-xl border border-white/15 bg-[#0d0d0d] px-3 py-3 text-sm text-white/65 file:mr-4 file:rounded-full file:border-0 file:bg-[#ffb800] file:px-4 file:py-2 file:font-bold file:text-[#080808]" disabled={pending} name="file" required type="file" />
        <span className="mt-2 block text-xs leading-5 text-white/40">JPEG, PNG, or WebP. Maximum 5 MB. File contents are verified.</span>
        {state.fieldErrors?.file?.length ? <span className="mt-2 block text-xs text-red-300" role="alert">{state.fieldErrors.file[0]}</span> : null}
      </label>
      {gallery ? (
        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-white/75">Accessible description</span>
          <input className="min-h-11 w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 text-sm text-white outline-none focus:border-[#ffb800]/70" disabled={pending} maxLength={320} name="altText" placeholder="Describe what is visible in this image" required />
          {state.fieldErrors?.altText?.length ? <span className="mt-2 block text-xs text-red-300" role="alert">{state.fieldErrors.altText[0]}</span> : null}
        </label>
      ) : null}
      <div className="mt-5 space-y-4">
        <ActionMessage state={state} />
        <button className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
          {pending ? "Uploading…" : gallery ? "Add gallery image" : safeCurrentUrl ? "Replace image" : "Upload image"}
        </button>
      </div>
    </form>
  );
}

function GalleryImage({ image }: { image: { id: string; url: string; altText: string } }) {
  const [state, action, pending] = useActionState(deleteProjectGalleryImage, initialState);
  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={image.altText} className="aspect-video w-full object-cover" loading="lazy" referrerPolicy="no-referrer" src={image.url} />
      <div className="p-4">
        <p className="text-sm leading-6 text-white/60">{image.altText}</p>
        <form action={action} className="mt-4" onSubmit={(event) => { if (!window.confirm("Remove this gallery image?")) event.preventDefault(); }}>
          <input name="imageId" type="hidden" value={image.id} />
          <ActionMessage state={state} />
          <button className="mt-3 min-h-10 cursor-pointer rounded-full border border-red-400/30 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
            {pending ? "Removing…" : "Remove image"}
          </button>
        </form>
      </div>
    </article>
  );
}

export function ProjectGalleryManager({ projectId, images }: { projectId: string; images: Array<{ id: string; url: string; altText: string }> }) {
  return (
    <section className="mt-10" aria-labelledby="project-gallery-heading">
      <p className="text-xs font-bold tracking-[0.14em] text-white/35 uppercase">Project media</p>
      <h2 className="mt-2 text-2xl font-bold" id="project-gallery-heading">Gallery</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {images.length ? (
          <div className="grid gap-4 sm:grid-cols-2">{images.map((image) => <GalleryImage image={image} key={image.id} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm leading-6 text-white/45">No gallery images yet.</div>
        )}
        <ImageUploadForm recordId={projectId} target="team-project-gallery" title="Add gallery image" />
      </div>
    </section>
  );
}
