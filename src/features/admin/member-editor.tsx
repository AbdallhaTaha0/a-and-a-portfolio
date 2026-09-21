"use client";

import { useActionState, useState } from "react";

import {
  deleteMemberProfileAsAdmin,
  type MemberAdminActionState,
  updateMemberAsAdmin,
} from "@/features/admin/member-actions";

type AdminEditableMember = {
  id: string;
  slug: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  location: string | null;
  phone: string | null;
  publicEmail: string | null;
  isPublished: boolean;
  teamOrder: number;
};

const initialState: MemberAdminActionState = {
  status: "idle",
  message: "",
};

const inputClassName =
  "min-h-12 w-full rounded-xl border border-white/15 bg-[#111] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <span className="mt-2 block text-sm text-red-300" role="alert">
      {errors[0]}
    </span>
  );
}

function ResultMessage({ state }: { state: MemberAdminActionState }) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}
    >
      {state.message}
    </p>
  );
}

export function AdminMemberEditor({ member }: { member: AdminEditableMember }) {
  const [state, formAction, pending] = useActionState(
    updateMemberAsAdmin,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]"
    >
      <input name="memberId" type="hidden" value={member.id} />
      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Full name
            </span>
            <input
              className={inputClassName}
              defaultValue={member.fullName}
              disabled={pending}
              maxLength={160}
              name="fullName"
              required
            />
            <FieldError errors={state.fieldErrors?.fullName} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Public slug
            </span>
            <input
              className={inputClassName}
              defaultValue={member.slug}
              disabled={pending}
              maxLength={120}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
            <span className="mt-2 block text-xs leading-5 text-white/40">
              Changing this changes the public profile address.
            </span>
            <FieldError errors={state.fieldErrors?.slug} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Team position
            </span>
            <input
              className={inputClassName}
              defaultValue={member.teamOrder}
              disabled={pending}
              max={1_000_000}
              min={0}
              name="teamOrder"
              required
              step={1}
              type="number"
            />
            <span className="mt-2 block text-xs leading-5 text-white/40">
              Lower numbers appear first on the public team list.
            </span>
            <FieldError errors={state.fieldErrors?.teamOrder} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Professional headline
            </span>
            <input
              className={inputClassName}
              defaultValue={member.headline ?? ""}
              disabled={pending}
              maxLength={240}
              name="headline"
            />
            <FieldError errors={state.fieldErrors?.headline} />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Biography
            </span>
            <textarea
              className={`${inputClassName} min-h-40 resize-y py-3`}
              defaultValue={member.bio ?? ""}
              disabled={pending}
              maxLength={4_000}
              name="bio"
            />
            <FieldError errors={state.fieldErrors?.bio} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Location
            </span>
            <input
              className={inputClassName}
              defaultValue={member.location ?? ""}
              disabled={pending}
              maxLength={160}
              name="location"
            />
            <FieldError errors={state.fieldErrors?.location} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Public email
            </span>
            <input
              className={inputClassName}
              defaultValue={member.publicEmail ?? ""}
              disabled={pending}
              maxLength={320}
              name="publicEmail"
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
              defaultValue={member.phone ?? ""}
              disabled={pending}
              maxLength={40}
              name="phone"
              type="tel"
            />
            <span className="mt-2 block text-xs leading-5 text-white/40">
              Visible here to administrators, never on public pages.
            </span>
            <FieldError errors={state.fieldErrors?.phone} />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white/80">
              Portrait URL
            </span>
            <input
              className={inputClassName}
              defaultValue={member.profileImageUrl ?? ""}
              disabled={pending}
              name="profileImageUrl"
              type="url"
            />
            <FieldError errors={state.fieldErrors?.profileImageUrl} />
          </label>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
        <label className="flex cursor-pointer gap-3 rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6">
          <input
            className="mt-1 size-4 accent-[#ffb800]"
            defaultChecked={member.isPublished}
            disabled={pending}
            name="isPublished"
            type="checkbox"
          />
          <span>
            <span className="block font-semibold text-white">Publish profile</span>
            <span className="mt-1 block text-sm leading-5 text-white/50">
              Publication requires a name, headline, and biography.
            </span>
          </span>
        </label>

        <ResultMessage state={state} />

        <button
          className="min-h-12 w-full cursor-pointer rounded-full bg-[#ffb800] px-5 font-bold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]/40 disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : "Save Member record"}
        </button>
      </aside>
    </form>
  );
}

export function DeleteMemberProfileForm({
  memberId,
  slug,
  ownerRole,
  ownerIsActive,
}: {
  memberId: string;
  slug: string;
  ownerRole: "TEAM_ADMIN" | "MEMBER";
  ownerIsActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    deleteMemberProfileAsAdmin,
    initialState,
  );
  const [confirmation, setConfirmation] = useState("");
  const mustDeactivateFirst = ownerRole === "MEMBER" && ownerIsActive;

  return (
    <form
      action={formAction}
      className="mt-6 rounded-3xl border border-red-400/25 bg-red-400/5 p-6 sm:p-8"
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Permanently delete this Member profile and all of its owned portfolio content? The login account will be retained.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="memberId" type="hidden" value={memberId} />
      <p className="text-xs font-bold tracking-[0.14em] text-red-200 uppercase">
        Destructive profile action
      </p>
      <h2 className="mt-2 text-2xl font-bold">Delete Member profile</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
        This permanently removes the Member record and its owned portfolio content.
        Audit history and the User account are retained. Account deactivation is a
        separate access-control action.
      </p>
      {mustDeactivateFirst ? (
        <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          Deactivate this MEMBER account from the accounts list before deleting its
          required profile.
        </p>
      ) : null}
      <label className="mt-6 block max-w-xl">
        <span className="mb-2 block text-sm font-semibold text-white/80">
          Type <strong>{slug}</strong> to confirm
        </span>
        <input
          autoComplete="off"
          className={inputClassName}
          disabled={pending || mustDeactivateFirst}
          maxLength={120}
          name="confirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          value={confirmation}
        />
        <FieldError errors={state.fieldErrors?.confirmation} />
      </label>
      <ResultMessage state={state} />
      <button
        className="mt-5 min-h-12 cursor-pointer rounded-full bg-red-500 px-6 font-bold text-white transition hover:bg-red-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-300/40 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={pending || mustDeactivateFirst || confirmation !== slug}
        type="submit"
      >
        {pending ? "Deleting…" : "Permanently delete profile"}
      </button>
    </form>
  );
}
