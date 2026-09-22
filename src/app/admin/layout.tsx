import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import logo from "../../../logo.png";
import {
  DashboardNavigation,
  type DashboardNavigationLink,
} from "@/components/site/dashboard-navigation";
import { signOutCurrentUser } from "@/features/auth/actions";
import { requireCurrentUser } from "@/server/auth/current-user";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

const administratorLinks: DashboardNavigationLink[] = [
  { href: "/admin", label: "Team dashboard" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/technologies", label: "Technologies" },
  { href: "/admin/achievements", label: "Achievements" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/team", label: "Team content" },
];

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  const links: DashboardNavigationLink[] = [
    ...(user.role === "TEAM_ADMIN" ? administratorLinks : []),
    ...(user.member ? [{ href: "/admin/profile", label: "My profile" }] : []),
    { href: "/", label: "View site" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="relative z-10 min-h-screen bg-[#080808]">
      <header className="border-b border-white/10 bg-[#080808]/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-5 py-4 sm:px-8">
          <Link
            aria-label="A&A public home"
            className="mr-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-white p-2 outline-none focus-visible:ring-3 focus-visible:ring-[#ffb800]"
            href="/"
          >
            <Image alt="A&A" className="h-8 w-auto" priority src={logo} />
          </Link>

          <DashboardNavigation links={links} />

          <div className="order-2 flex items-center gap-3 lg:order-3">
            <div className="hidden text-right md:block">
              <p className="max-w-52 truncate text-sm font-semibold">
                {user.name ?? user.email}
              </p>
              <p className="text-[0.68rem] font-semibold tracking-[0.08em] text-white/40 uppercase">
                {user.role.replace("_", " ")}
              </p>
            </div>
            <form action={signOutCurrentUser}>
              <button
                className="min-h-11 cursor-pointer rounded-full border border-white/15 px-4 text-sm font-semibold text-white/75 transition hover:border-[#ffb800]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}
