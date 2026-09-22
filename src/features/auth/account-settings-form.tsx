"use client";

import { useActionState } from "react";

import {
  updateOwnAccountSettings,
  type AccountSettingsState,
} from "@/features/auth/account-settings-actions";

const initialState: AccountSettingsState = { status: "idle", message: "" };

export function AccountSettingsForm({ name }: { name: string | null }) {
  const [state, formAction, pending] = useActionState(
    updateOwnAccountSettings,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white/80">Dashboard display name</span>
        <input
          className="min-h-12 w-full rounded-xl border border-white/15 bg-[#0d0d0d] px-4 text-white outline-none transition placeholder:text-white/25 focus:border-[#ffb800]/70 focus:ring-2 focus:ring-[#ffb800]/20 disabled:cursor-not-allowed disabled:opacity-60"
          defaultValue={name ?? ""}
          disabled={pending}
          maxLength={160}
          name="name"
          placeholder="How your name appears in the dashboard"
        />
        <span className="mt-2 block text-xs leading-5 text-white/40">
          This changes the dashboard account label, not your public member-profile name.
        </span>
        {state.fieldErrors?.name?.length ? <span className="mt-2 block text-sm text-red-300" role="alert">{state.fieldErrors.name[0]}</span> : null}
      </label>

      {state.message ? (
        <p aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
          {state.message}
        </p>
      ) : null}

      <button className="min-h-11 cursor-pointer rounded-full bg-[#ffb800] px-6 text-sm font-bold text-[#080808] transition hover:bg-[#ffc83d] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save account settings"}
      </button>
    </form>
  );
}
