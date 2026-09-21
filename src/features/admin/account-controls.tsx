"use client";

import { useActionState } from "react";

import {
  type AccountActionState,
  changeAccountRole,
  changeAccountStatus,
} from "@/features/admin/account-actions";

const initialState: AccountActionState = { status: "idle", message: "" };

function ResultMessage({ state }: { state: AccountActionState }) {
  if (!state.message) return null;
  return (
    <p
      aria-live="polite"
      className={`mt-3 text-xs ${state.status === "success" ? "text-emerald-200" : "text-red-200"}`}
    >
      {state.message}
    </p>
  );
}

export function AccountControls({
  account,
  activeAdministratorCount,
  isCurrentAccount,
}: {
  account: {
    id: string;
    role: "TEAM_ADMIN" | "MEMBER";
    isActive: boolean;
    hasMemberProfile: boolean;
  };
  activeAdministratorCount: number;
  isCurrentAccount: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(
    changeAccountRole,
    initialState,
  );
  const [statusState, statusAction, statusPending] = useActionState(
    changeAccountStatus,
    initialState,
  );
  const isFinalActiveAdministrator =
    account.role === "TEAM_ADMIN" &&
    account.isActive &&
    activeAdministratorCount <= 1;
  const nextRole = account.role === "TEAM_ADMIN" ? "MEMBER" : "TEAM_ADMIN";
  const roleDisabled =
    rolePending ||
    (nextRole === "MEMBER" &&
      (!account.hasMemberProfile || isFinalActiveAdministrator));
  const statusDisabled = statusPending || (account.isActive && isFinalActiveAdministrator);

  return (
    <div className="border-t border-white/10 pt-4 md:col-span-3">
      <div className="flex flex-wrap items-center gap-3">
        <form
          action={roleAction}
          onSubmit={(event) => {
            const label = nextRole === "TEAM_ADMIN" ? "promote" : "demote";
            if (!window.confirm(`Are you sure you want to ${label} this account? Its active sessions will be revoked.`)) {
              event.preventDefault();
            }
          }}
        >
          <input name="userId" type="hidden" value={account.id} />
          <input name="role" type="hidden" value={nextRole} />
          <button
            className="min-h-10 cursor-pointer rounded-full border border-white/15 px-4 text-xs font-semibold text-white/65 transition hover:border-[#ffb800]/45 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            disabled={roleDisabled}
            type="submit"
          >
            {rolePending
              ? "Updating…"
              : nextRole === "TEAM_ADMIN"
                ? "Promote to administrator"
                : "Demote to member"}
          </button>
        </form>

        <form
          action={statusAction}
          onSubmit={(event) => {
            if (
              account.isActive &&
              !window.confirm("Deactivate this account and revoke all of its active sessions?")
            ) {
              event.preventDefault();
            }
          }}
        >
          <input name="userId" type="hidden" value={account.id} />
          <input name="isActive" type="hidden" value={String(!account.isActive)} />
          <button
            className={`min-h-10 cursor-pointer rounded-full border px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${account.isActive ? "border-red-400/25 text-red-200 hover:bg-red-400/10" : "border-emerald-400/25 text-emerald-200 hover:bg-emerald-400/10"}`}
            disabled={statusDisabled}
            type="submit"
          >
            {statusPending ? "Updating…" : account.isActive ? "Deactivate" : "Activate"}
          </button>
        </form>

        {isCurrentAccount ? (
          <span className="text-xs text-white/35">This is your account.</span>
        ) : null}
        {isFinalActiveAdministrator ? (
          <span className="text-xs text-[#ffc83d]">
            Add another active administrator before changing this account&apos;s access.
          </span>
        ) : null}
        {account.role === "TEAM_ADMIN" && !account.hasMemberProfile ? (
          <span className="text-xs text-white/35">
            A Member profile is required before demotion.
          </span>
        ) : null}
      </div>
      <ResultMessage state={roleState} />
      <ResultMessage state={statusState} />
    </div>
  );
}
