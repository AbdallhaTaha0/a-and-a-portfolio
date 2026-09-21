import Link from "next/link";

import { TimelineManager } from "@/features/members/timeline-manager";
import { requireCurrentMember } from "@/server/auth/current-user";
import { getOwnEducation } from "@/server/members/owned-timeline";

function toDateInput(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? null;
}

export default async function EducationPage() {
  const { member } = await requireCurrentMember();
  const records = await getOwnEducation(member.id);

  return (
    <div>
      <Link className="text-sm font-semibold text-white/45 transition hover:text-white" href="/admin/profile">
        ← Profile overview
      </Link>
      <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
        Personal workspace
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
        Education
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-white/55">
        Add the learning experiences that support your work. Changes appear publicly
        only while your profile is published.
      </p>

      <TimelineManager
        items={records.map((record) => ({
          ...record,
          startDate: toDateInput(record.startDate) ?? "",
          endDate: toDateInput(record.endDate),
        }))}
        kind="education"
      />
    </div>
  );
}
