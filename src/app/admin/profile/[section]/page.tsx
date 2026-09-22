import Link from "next/link";
import { notFound } from "next/navigation";

import { PortfolioManager } from "@/features/members/portfolio-manager";
import {
  portfolioKinds,
  type PortfolioKind,
} from "@/features/members/portfolio-schema";
import { requireCurrentMember } from "@/server/auth/current-user";
import { getOwnPortfolio } from "@/server/members/owned-portfolio";

type PortfolioSectionPageProps = { params: Promise<{ section: string }> };

const sectionCopy: Record<
  PortfolioKind,
  { title: string; description: string }
> = {
  skills: {
    title: "Skills",
    description:
      "Add the capabilities you want visitors to associate with your work. Shared skill names stay consistent across the team.",
  },
  certifications: {
    title: "Certifications",
    description:
      "Document verified training and credentials. Secure credential links may be shown on your published profile.",
  },
  achievements: {
    title: "Achievements",
    description:
      "Capture awards and personal milestones that help explain the impact of your work.",
  },
  projects: {
    title: "Personal projects",
    description:
      "Manage work owned by you. Draft projects remain private until you explicitly publish them.",
  },
  links: {
    title: "Social links",
    description:
      "Add the professional profiles you want visitors to use. Only secure HTTPS links are accepted.",
  },
};

function isPortfolioKind(value: string): value is PortfolioKind {
  return portfolioKinds.some((kind) => kind === value);
}

export default async function PortfolioSectionPage({
  params,
}: PortfolioSectionPageProps) {
  const { section } = await params;
  if (!isPortfolioKind(section)) notFound();

  const { member } = await requireCurrentMember();
  const items = await getOwnPortfolio(member.id, section);
  const copy = sectionCopy[section];

  return (
    <div>
      <Link
        className="text-sm font-semibold text-white/45 transition hover:text-white"
        href="/admin/profile"
      >
        ← Profile overview
      </Link>
      <p className="mt-8 text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">
        Personal workspace
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
        {copy.title}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-white/55">{copy.description}</p>

      <PortfolioManager items={items} kind={section} />
    </div>
  );
}
