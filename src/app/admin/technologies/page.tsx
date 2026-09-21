import Link from "next/link";

import { TechnologyManager } from "@/features/technologies/technology-manager";
import { getAdminTechnologies } from "@/server/admin/technologies";
import { requireTeamAdmin } from "@/server/auth/current-user";

export default async function AdminTechnologiesPage() {
  await requireTeamAdmin();
  const technologies = await getAdminTechnologies();
  return <div><Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin">← Team dashboard</Link><p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Team administration</p><h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Technologies</h1><p className="mt-3 max-w-3xl leading-7 text-white/55">Maintain the reusable technology dictionary. Technologies in use must be removed from projects before deletion.</p><TechnologyManager technologies={technologies} /></div>;
}
