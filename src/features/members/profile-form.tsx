"use client";

import { useActionState } from "react";

import {
  type ProfileActionState,
  updateOwnProfile,
} from "@/features/members/actions";

type EditableProfile = {
  slug: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  location: string | null;
  phone: string | null;
  publicEmail: string | null;
  isPublished: boolean;
};

const initialState: ProfileActionState = {
  status: "idle",
  message: "",
};

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

export function MemberProfileForm({ profile }: { profile: EditableProfile }) {
  const [state, formAction, pending] = useActionState(
    updateOwnProfile,
    initialState,
  );

  return (
    <form action={formAction} className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Full name
            </span>
            <input
              aria-describedby="fullName-error"
              className={inputClassName}
              defaultValue={profile.fullName}
              disabled={pending}
              maxLength={160}
              name="fullName"
              required
            />
            <span id="fullName-error">
              <FieldError errors={state.fieldErrors?.fullName} />
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Professional headline
            </span>
            <input
              aria-describedby="headline-help headline-error"
              className={inputClassName}
              defaultValue={profile.headline ?? ""}
              disabled={pending}
              maxLength={240}
              name="headline"
              placeholder="Product designer and frontend engineer"
            />
            <span className="mt-2 block text-xs text-white/40" id="headline-help">
              Required when the profile is published.
            </span>
            <span id="headline-error">
              <FieldError errors={state.fieldErrors?.headline} />
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Biography
            </span>
            <textarea
              aria-describedby="bio-help bio-error"
              className={`${inputClassName} min-h-40 resize-y py-3`}
              defaultValue={profile.bio ?? ""}
              disabled={pending}
              maxLength={4000}
              name="bio"
              placeholder="Introduce your experience, focus, and the work you care about."
            />
            <span className="mt-2 block text-xs text-white/40" id="bio-help">
              Plain text, up to 4,000 characters. Required when published.
            </span>
            <span id="bio-error">
              <FieldError errors={state.fieldErrors?.bio} />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Location
            </span>
            <input
              className={inputClassName}
              defaultValue={profile.location ?? ""}
              disabled={pending}
              maxLength={160}
              name="location"
              placeholder="Cairo, Egypt"
            />
            <FieldError errors={state.fieldErrors?.location} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Public email
            </span>
            <input
              className={inputClassName}
              defaultValue={profile.publicEmail ?? ""}
              disabled={pending}
              inputMode="email"
              maxLength={320}
              name="publicEmail"
              placeholder="hello@example.com"
              type="email"
            />
            <FieldError errors={state.fieldErrors?.publicEmail} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Private phone
            </span>
            <input
              className={inputClassName}
              defaultValue={profile.phone ?? ""}
              disabled={pending}
              maxLength={40}
              name="phone"
              placeholder="Not shown publicly"
              type="tel"
            />
            <FieldError errors={state.fieldErrors?.phone} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Portrait URL
            </span>
            <input
              className={inputClassName}
              defaultValue={profile.profileImageUrl ?? ""}
              disabled={pending}
              inputMode="url"
              name="profileImageUrl"
              placeholder="https://…"
              type="url"
            />
            <FieldError errors={state.fieldErrors?.profileImageUrl} />
          </label>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-3xl border border-white/10 bg-[#111] p-6">
          <p className="text-xs font-bold tracking-[0.12em] text-white/40 uppercase">
            Public address
          </p>
          <p className="mt-3 break-all text-sm text-white/75">
            /members/{profile.slug}
          </p>
          <p className="mt-3 text-xs leading-5 text-white/40">
            The stable address does not change when you edit your name.
          </p>
        </div>

        <label className="flex cursor-pointer gap-3 rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6">
          <input
            className="mt-1 size-4 accent-[#ffb800]"
            defaultChecked={profile.isPublished}
            disabled={pending}
            name="isPublished"
            type="checkbox"
          />
          <span>
            <span className="block font-semibold text-white">Publish profile</span>
            <span className="mt-1 block text-sm leading-5 text-white/50">
              When enabled, anyone can visit your public profile.
            </span>
          </span>
        </label>

        {state.message ? (
          <p
            aria-live="polite"
            className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          className="min-h-12 w-full cursor-pointer rounded-full bg-[#ffb800] px-5 font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40 disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </aside>
    </form>
  );
}
