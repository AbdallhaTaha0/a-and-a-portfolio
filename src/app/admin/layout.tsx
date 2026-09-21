import Image from "next/image";
import Link from "next/link";

import logo from "../../../logo.png";
import { signOutCurrentUser } from "@/features/auth/actions";
import { requireCurrentUser } from "@/server/auth/current-user";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]">
      <header className="border-b border-white/10 bg-[#080808]/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-5 py-4 sm:px-8">
          <Link
            className="mr-auto inline-flex rounded-xl bg-white p-2 outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]"
            href="/"
            aria-label="A&A public home"
          >
            <Image alt="A&A" className="h-8 w-auto" priority src={logo} />
          </Link>

          <nav aria-label="Dashboard navigation" className="order-3 flex w-full flex-wrap items-center gap-2 sm:order-2 sm:w-auto">
            {user.role === "TEAM_ADMIN" ? (
              <>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin">
                  Team dashboard
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/members">
                  Members
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/projects">
                  Projects
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/technologies">
                  Technologies
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/achievements">
                  Achievements
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/testimonials">
                  Testimonials
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/team">
                  Team content
                </Link>
              </>
            ) : null}
            {user.member ? (
              <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/admin/profile">
                My profile
              </Link>
            ) : null}
            <Link className="rounded-full px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" href="/">
              View site
            </Link>
          </nav>

          <div className="order-2 flex items-center gap-3 sm:order-3">
            <div className="hidden text-right md:block">
              <p className="max-w-52 truncate text-sm font-semibold">{user.name ?? user.email}</p>
              <p className="text-[0.68rem] font-semibold tracking-[0.08em] text-white/40 uppercase">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <form action={signOutCurrentUser}>
              <button className="min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">{children}</main>
    </div>
  );
}
