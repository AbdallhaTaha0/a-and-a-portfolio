import Link from "next/link";

import { requireTeamAdmin } from "@/server/auth/current-user";

export default async function AdminPage() {
  const user = await requireTeamAdmin();

  return (
    <div>
      <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
        Team administration
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
        Welcome, {user.name ?? user.email}
      </h1>
      <p className="mt-4 max-w-2xl leading-7 text-white/60">
        Manage the A&A home page, members, projects, and team content from this
        protected workspace.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Team administration areas">
        <Link className="rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6 transition hover:border-[#ffb800]/55 hover:bg-[#ffb800]/10" href="/admin/team">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Team content</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Home-page content and team identity</p>
          <p className="mt-6 text-xs font-semibold tracking-[0.1em] text-[#ffc83d] uppercase">Edit team content →</p>
        </Link>
        <Link className="rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6 transition hover:border-[#ffb800]/55 hover:bg-[#ffb800]/10" href="/admin/members">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Members</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Accounts, profiles, access, and invitations</p>
          <p className="mt-6 text-xs font-semibold tracking-[0.1em] text-[#ffc83d] uppercase">Manage members →</p>
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Projects</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Team work, contributors, and publication</p>
          <p className="mt-6 text-xs font-semibold tracking-[0.1em] text-white/30 uppercase">Editor coming next</p>
        </div>
      </section>

      {!user.member ? (
        <section className="mt-8 rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Public profile not connected
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            This administrator account can manage the team but does not yet own a Member
            profile. Linking one will add a personal workspace and optional public page.
          </p>
          <Link className="mt-5 inline-flex text-sm font-semibold text-[#ffc83d] underline-offset-4 hover:underline" href="/admin/members">
            Create my Member profile →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
