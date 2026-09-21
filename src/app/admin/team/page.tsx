import Link from "next/link";

import { TeamContentForm } from "@/features/team/team-form";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { getEditableTeam } from "@/server/team/team";

const defaultTeam = {
  name: "A&A",
  shortDescription: null,
  description: null,
  contactEmail: null,
  location: null,
  githubUrl: null,
  linkedinUrl: null,
};

export default async function TeamContentPage() {
  await requireTeamAdmin();
  const team = (await getEditableTeam()) ?? defaultTeam;

  return (
    <div>
      <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin">← Team dashboard</Link>
      <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Team administration</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Team content</h1>
      <p className="mt-3 max-w-3xl leading-7 text-white/55">Manage the public identity, landing-page introduction, contact details, and social destinations without editing code.</p>
      <TeamContentForm team={team} />
    </div>
  );
}
