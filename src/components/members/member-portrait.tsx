import { safeExternalUrl } from "@/lib/urls";

export function MemberPortrait({
  name,
  url,
  eager = false,
}: {
  name: string;
  url: string | null;
  eager?: boolean;
}) {
  const safeUrl = safeExternalUrl(url);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-white/15 bg-gradient-to-br from-[#ffb800]/25 via-white/5 to-white/10">
      {safeUrl?.startsWith("https://") ? (
        // User-configurable hosts are intentionally loaded by the browser, not Next's server-side image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} portrait`}
          className="size-full object-cover"
          loading={eager ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          src={safeUrl}
        />
      ) : (
        <div className="grid size-full place-items-center font-[family-name:var(--font-display)] text-4xl font-bold text-[#ffc83d]" aria-hidden="true">
          {initials || "A&A"}
        </div>
      )}
    </div>
  );
}
