import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutCurrentUser } from "@/features/auth/actions";
import { requireCurrentUser } from "@/server/auth/current-user";

export default async function ProfileSetupRequiredPage() {
  const user = await requireCurrentUser();

  if (user.member) {
    redirect("/admin/profile");
  }

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-[#ffb800]/25 bg-[#ffb800]/5 p-7 sm:p-10">
      <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
        Profile setup required
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
        No Member profile is linked to this account
      </h1>
      <p className="mt-4 leading-7 text-white/65">
        A team administrator must create or link your Member profile before the personal
        workspace becomes available. Your account is active, but it has no personal
        content ownership yet.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {user.role === "TEAM_ADMIN" ? (
          <Link className="inline-flex min-h-11 items-center rounded-full bg-[#ffb800] px-5 font-semibold text-[#080808] transition hover:bg-[#ffc83d] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white" href="/admin/members">
            Create my Member profile
          </Link>
        ) : null}
        <form action={signOutCurrentUser}>
          <button className="min-h-11 cursor-pointer rounded-full border border-white/15 px-5 font-semibold text-white/75 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </section>
  );
}
