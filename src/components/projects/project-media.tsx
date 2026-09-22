import { safeExternalUrl } from "@/lib/urls";

export function ProjectMedia({
  alt,
  eager = false,
  url,
}: {
  alt: string;
  eager?: boolean;
  url: string | null;
}) {
  const safeUrl = safeExternalUrl(url);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#ffb800]/25 via-white/[0.06] to-white/[0.02]">
      {safeUrl?.startsWith("https://") ? (
        // Project media can currently use administrator-configured hosts, so it is loaded by the browser until storage is centralized.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className="size-full object-cover transition duration-500 group-hover:scale-[1.025]"
          loading={eager ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          src={safeUrl}
        />
      ) : (
        <div className="grid size-full place-items-center" aria-hidden="true">
          <span className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.08em] text-[#ffc83d]">
            A&amp;A
          </span>
        </div>
      )}
    </div>
  );
}
