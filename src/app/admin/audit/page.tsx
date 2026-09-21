import Link from "next/link";
import { formatAuditMetadata } from "@/features/audit/audit-metadata";
import { getRecentAuditLogs } from "@/server/admin/audit";
import { requireTeamAdmin } from "@/server/auth/current-user";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default async function AuditLogPage() {
  await requireTeamAdmin();
  const logs = await getRecentAuditLogs();
  return <div><Link className="text-sm font-semibold text-white/45 hover:text-white" href="/admin">← Team dashboard</Link><p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Restricted administration</p><h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Audit log</h1><p className="mt-3 max-w-3xl leading-7 text-white/55">Review the latest 100 security-sensitive and administrative changes. Audit records are read-only.</p>
    {logs.length ? <div className="mt-8 grid gap-3">{logs.map((log) => { const metadata = formatAuditMetadata(log.metadata); return <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5" key={log.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-white/85">{log.action.replaceAll("_", " ")}</h2><p className="mt-1 text-sm text-white/45">{log.entityType}{log.entityId ? ` · ${log.entityId}` : ""}</p></div><div className="text-right text-xs text-white/40"><p>{dateFormat.format(log.createdAt)} UTC</p><p className="mt-1">{log.user?.name ?? log.user?.email ?? "System or removed account"}</p></div></div>{metadata.length ? <dl className="mt-4 flex flex-wrap gap-2">{metadata.map(({ key, value }) => <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs" key={key}><dt className="text-white/35">{key}</dt><dd className="mt-1 max-w-72 break-all text-white/65">{value}</dd></div>)}</dl> : null}</article>; })}</div> : <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-8 text-center"><h2 className="font-semibold">No audit records yet</h2><p className="mt-2 text-sm text-white/45">Administrative and security-sensitive changes will appear here.</p></div>}
  </div>;
}
