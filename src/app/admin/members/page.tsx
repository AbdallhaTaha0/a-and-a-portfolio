import Link from "next/link";

import { AccountControls } from "@/features/admin/account-controls";
import { OwnMemberProfileForm, InviteAdministratorForm, InviteMemberForm } from "@/features/admin/account-forms";
import { suggestSlug } from "@/features/admin/accounts-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { getTeamAccounts } from "@/server/admin/accounts";
import { getAdminMemberSummaries } from "@/server/admin/members";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function TeamMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ profileDeleted?: string }>;
}) {
  const administrator = await requireTeamAdmin();
  const [{ accounts, activeAdministratorCount }, members, query] = await Promise.all([
    getTeamAccounts(),
    getAdminMemberSummaries(),
    searchParams,
  ]);
  const defaultName = administrator.name?.trim() || administrator.email.split("@")[0] || "Team member";

  return (
    <div>
      <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin">← Team dashboard</Link>
      <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Team administration</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Accounts and profiles</h1>
      <p className="mt-3 max-w-3xl leading-7 text-white/55">Pre-authorize team email addresses for Google or GitHub sign-in, manage role visibility, and connect administrators to optional public profiles.</p>

      {query.profileDeleted === "1" ? (
        <p className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100" role="status">
          Member profile deleted. Its User account and audit history were retained.
        </p>
      ) : null}

      {!administrator.member ? (
        <section className="mt-10 rounded-3xl border border-[#ffb800]/30 bg-[#ffb800]/5 p-6 sm:p-8" aria-labelledby="own-profile-heading">
          <p className="text-xs font-bold tracking-[0.12em] text-[#ffc83d] uppercase">Your public presence</p>
          <h2 className="mt-2 text-2xl font-bold" id="own-profile-heading">Create your Member profile</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">This links a new draft profile directly to your signed-in administrator account. It does not change your administrator permissions.</p>
          <OwnMemberProfileForm defaultFullName={defaultName} defaultSlug={suggestSlug(defaultName)} />
        </section>
      ) : (
        <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <div><p className="font-semibold text-emerald-100">Your Member profile is connected.</p><p className="mt-1 text-sm text-white/50">Administrator access and personal-profile ownership remain separate.</p></div>
          <Link className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:border-[#ffb800]/50" href="/admin/profile">Open my profile</Link>
        </section>
      )}

      <section className="mt-10 grid gap-5 lg:grid-cols-2 lg:items-start" aria-label="Create team accounts">
        <details className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 open:border-white/20" open>
          <summary className="cursor-pointer text-xl font-bold">Add a member</summary>
          <p className="mb-6 mt-2 text-sm leading-6 text-white/45">Creates an active MEMBER account and linked draft profile. Only the exact email can sign in.</p>
          <InviteMemberForm />
        </details>
        <details className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 open:border-white/20">
          <summary className="cursor-pointer text-xl font-bold">Add an administrator</summary>
          <p className="mb-6 mt-2 text-sm leading-6 text-white/45">Creates another TEAM_ADMIN account. They can optionally create their own Member profile after signing in.</p>
          <InviteAdministratorForm />
        </details>
      </section>

      <section className="mt-12" aria-labelledby="member-profiles-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Public portfolio records</p>
            <h2 className="mt-2 text-2xl font-bold" id="member-profiles-heading">
              {members.length} Member profile{members.length === 1 ? "" : "s"}
            </h2>
          </div>
          <p className="text-xs text-white/35">Ordered by team position</p>
        </div>

        {members.length ? (
          <div className="mt-5 grid gap-3">
            {members.map((member) => (
              <article className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center" key={member.id}>
                <span className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/55" aria-label={`Team position ${member.teamOrder}`}>
                  {member.teamOrder}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white/85">{member.fullName}</h3>
                  <p className="mt-1 truncate text-sm text-white/45">{member.headline ?? "No headline yet"} · {member.user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-semibold tracking-[0.06em] uppercase">
                    <span className={`rounded-full border px-2.5 py-1 ${member.isPublished ? "border-emerald-400/25 text-emerald-200" : "border-white/10 text-white/45"}`}>{member.isPublished ? "Published" : "Draft"}</span>
                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-white/45">{member.user.role.replace("_", " ")}</span>
                    {!member.user.isActive ? <span className="rounded-full border border-red-400/25 px-2.5 py-1 text-red-200">Account inactive</span> : null}
                  </div>
                </div>
                <Link className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#ffb800]/35 px-5 text-sm font-semibold text-[#ffc83d] transition hover:bg-[#ffb800]/10" href={`/admin/members/${member.id}`}>
                  View and edit
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <h3 className="font-semibold text-white/80">No Member profiles yet</h3>
            <p className="mt-2 text-sm text-white/45">Create a member account above to add the first draft profile.</p>
          </div>
        )}
      </section>

      <section className="mt-12" aria-labelledby="team-accounts-heading">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.12em] text-white/35 uppercase">Authorized access</p><h2 className="mt-2 text-2xl font-bold" id="team-accounts-heading">{accounts.length} team account{accounts.length === 1 ? "" : "s"}</h2></div><p className="text-xs text-white/35">Showing up to 100 accounts</p></div>
        <div className="mt-5 grid gap-3">
          {accounts.map((account) => (
            <article className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-[minmax(0,1.3fr)_auto_auto] md:items-center" key={account.id}>
              <div className="min-w-0"><h3 className="truncate font-semibold text-white/85">{account.name ?? account.member?.fullName ?? account.email}</h3><p className="mt-1 truncate text-sm text-white/45">{account.email}</p></div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.07em]"><span className="rounded-full border border-white/10 px-3 py-1.5 text-white/55">{account.role.replace("_", " ")}</span><span className={`rounded-full border px-3 py-1.5 ${account.isActive ? "border-emerald-400/25 text-emerald-200" : "border-red-400/25 text-red-200"}`}>{account.isActive ? "Active" : "Inactive"}</span>{account.member ? <span className="rounded-full border border-[#ffb800]/25 px-3 py-1.5 text-[#ffc83d]">{account.member.isPublished ? "Profile published" : "Profile draft"}</span> : null}</div>
              <div className="text-left text-xs leading-5 text-white/35 md:text-right"><p>{account._count.accounts ? "Provider connected" : "Awaiting first sign-in"}</p><p>{account.lastLoginAt ? `Last login ${dateFormat.format(account.lastLoginAt)}` : `Added ${dateFormat.format(account.createdAt)}`}</p></div>
              <AccountControls
                account={{
                  id: account.id,
                  role: account.role,
                  isActive: account.isActive,
                  hasMemberProfile: Boolean(account.member),
                }}
                activeAdministratorCount={activeAdministratorCount}
                isCurrentAccount={account.id === administrator.id}
              />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
