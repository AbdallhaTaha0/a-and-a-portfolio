import Link from "next/link";

export default function AdminMemberNotFound() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 sm:p-10">
      <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
        Member not found
      </p>
      <h1 className="mt-3 text-3xl font-bold">This Member profile is unavailable</h1>
      <p className="mt-3 max-w-xl leading-7 text-white/55">
        It may have been removed by another administrator, or the address may be
        incorrect.
      </p>
      <Link
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold text-[#080808]"
        href="/admin/members"
      >
        Return to members
      </Link>
    </section>
  );
}
