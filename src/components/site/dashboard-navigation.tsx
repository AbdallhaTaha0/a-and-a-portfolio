import Link from "next/link";

export type DashboardNavigationLink = {
  href: string;
  label: string;
};

const desktopLinkClass =
  "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-white/65 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]";

export function DashboardNavigation({
  links,
}: {
  links: DashboardNavigationLink[];
}) {
  return (
    <div className="order-3 w-full lg:order-2 lg:w-auto">
      <nav
        aria-label="Dashboard navigation"
        className="hidden max-w-4xl flex-wrap items-center justify-center gap-1 lg:flex"
      >
        {links.map((link) => (
          <Link className={desktopLinkClass} href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>

      <details className="group lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/75 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800] [&::-webkit-details-marker]:hidden">
          Dashboard menu
          <span className="text-[#ffc83d] transition group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>
        <nav
          aria-label="Mobile dashboard navigation"
          className="mt-3 grid gap-1 rounded-2xl border border-white/15 bg-[#101010] p-2 shadow-2xl sm:grid-cols-2"
        >
          {links.map((link) => (
            <Link
              className="flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb800]"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </details>
    </div>
  );
}
