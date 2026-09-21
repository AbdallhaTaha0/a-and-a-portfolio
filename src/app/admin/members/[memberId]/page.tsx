import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdminMemberEditor,
  DeleteMemberProfileForm,
} from "@/features/admin/member-editor";
import { getAdminMemberById } from "@/server/admin/members";
import { requireTeamAdmin } from "@/server/auth/current-user";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  await requireTeamAdmin();
  const { memberId } = await params;
  const member = await getAdminMemberById(memberId);
  if (!member) notFound();

  const contentCount = Object.values(member._count).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div>
      <Link
        className="text-sm font-semibold text-white/45 transition hover:text-white"
        href="/admin/members"
      >
        ← Accounts and profiles
      </Link>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
            Complete Member record
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            {member.fullName}
          </h1>
          <p className="mt-3 text-sm text-white/50">
            Owned by {member.user.email} · Created {dateFormat.format(member.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold tracking-[0.06em] uppercase">
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-white/60">
            {member.user.role.replace("_", " ")}
          </span>
          <span
            className={`rounded-full border px-3 py-1.5 ${member.user.isActive ? "border-emerald-400/25 text-emerald-200" : "border-red-400/25 text-red-200"}`}
          >
            Account {member.user.isActive ? "active" : "inactive"}
          </span>
          <span className="rounded-full border border-[#ffb800]/25 px-3 py-1.5 text-[#ffc83d]">
            {member.isPublished ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Record summary">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-white/40">Team position</p>
          <p className="mt-1 text-xl font-bold">{member.teamOrder}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-white/40">Related content</p>
          <p className="mt-1 text-xl font-bold">{contentCount}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs text-white/40">Last updated</p>
          <p className="mt-1 text-sm font-semibold">
            {dateFormat.format(member.updatedAt)}
          </p>
        </div>
      </section>

      <AdminMemberEditor
        member={{
          id: member.id,
          slug: member.slug,
          fullName: member.fullName,
          headline: member.headline,
          bio: member.bio,
          profileImageUrl: member.profileImageUrl,
          location: member.location,
          phone: member.phone,
          publicEmail: member.publicEmail,
          isPublished: member.isPublished,
          teamOrder: member.teamOrder,
        }}
      />

      <DeleteMemberProfileForm
        memberId={member.id}
        ownerIsActive={member.user.isActive}
        ownerRole={member.user.role}
        slug={member.slug}
      />
    </div>
  );
}
