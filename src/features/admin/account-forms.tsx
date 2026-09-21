"use client";

import { useActionState } from "react";

import {
  type AccountActionState,
  createOwnMemberProfile,
  inviteAdministratorAccount,
  inviteMemberAccount,
} from "@/features/admin/account-actions";

const initialState: AccountActionState = { status: "idle", message: "" };
const inputClassName =
  "min-h-11 w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? (
    <span className="mt-2 block text-xs text-red-300" role="alert">{errors[0]}</span>
  ) : null;
}

function Message({ state }: { state: AccountActionState }) {
  if (!state.message) return null;
  return (
    <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
      {state.message}
    </p>
  );
}

export function OwnMemberProfileForm({
  defaultFullName,
  defaultSlug,
}: {
  defaultFullName: string;
  defaultSlug: string;
}) {
  const [state, formAction, pending] = useActionState(createOwnMemberProfile, initialState);
  return (
    <form action={formAction} className="mt-6 grid gap-5 sm:grid-cols-2">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Public name</span>
        <input className={inputClassName} defaultValue={defaultFullName} disabled={pending} maxLength={160} name="fullName" required />
        <FieldError errors={state.fieldErrors?.fullName} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Public slug</span>
        <input className={inputClassName} defaultValue={defaultSlug} disabled={pending} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
        <FieldError errors={state.fieldErrors?.slug} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-white/75">Headline</span>
        <input className={inputClassName} disabled={pending} maxLength={240} name="headline" placeholder="Optional for the initial draft" />
        <FieldError errors={state.fieldErrors?.headline} />
      </label>
      <div className="sm:col-span-2"><Message state={state} /></div>
      <button className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create my Member profile"}
      </button>
    </form>
  );
}

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMemberAccount, initialState);
  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-white/75">Invited email</span>
        <input className={inputClassName} disabled={pending} maxLength={320} name="email" placeholder="member@example.com" required type="email" />
        <FieldError errors={state.fieldErrors?.email} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Full name</span>
        <input className={inputClassName} disabled={pending} maxLength={160} name="fullName" required />
        <FieldError errors={state.fieldErrors?.fullName} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Public slug</span>
        <input className={inputClassName} disabled={pending} maxLength={120} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="member-name" required />
        <FieldError errors={state.fieldErrors?.slug} />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-white/75">Headline</span>
        <input className={inputClassName} disabled={pending} maxLength={240} name="headline" placeholder="Optional draft headline" />
        <FieldError errors={state.fieldErrors?.headline} />
      </label>
      <div className="sm:col-span-2"><Message state={state} /></div>
      <button className="min-h-11 cursor-pointer rounded-full bg-white px-6 text-sm font-bold text-[#080808] transition hover:bg-white/85 disabled:cursor-wait disabled:opacity-60 sm:col-span-2 sm:justify-self-start" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create member account"}
      </button>
    </form>
  );
}

export function InviteAdministratorForm() {
  const [state, formAction, pending] = useActionState(inviteAdministratorAccount, initialState);
  return (
    <form action={formAction} className="grid gap-5">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Administrator name</span>
        <input className={inputClassName} disabled={pending} maxLength={160} name="name" required />
        <FieldError errors={state.fieldErrors?.name} />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/75">Invited email</span>
        <input className={inputClassName} disabled={pending} maxLength={320} name="email" placeholder="admin@example.com" required type="email" />
        <FieldError errors={state.fieldErrors?.email} />
      </label>
      <Message state={state} />
      <button className="min-h-11 cursor-pointer rounded-full border border-[#ffb800]/45 px-6 text-sm font-bold text-[#ffc83d] transition hover:bg-[#ffb800]/10 disabled:cursor-wait disabled:opacity-60 sm:justify-self-start" disabled={pending} type="submit">
        {pending ? "Creating…" : "Create administrator account"}
      </button>
    </form>
  );
}
