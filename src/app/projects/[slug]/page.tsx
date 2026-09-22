import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/projects/project-detail";
import { safeExternalUrl } from "@/lib/urls";
import { getPublishedProjectBySlug } from "@/server/projects/public-projects";

export const dynamic = "force-dynamic";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { title: "Project not found" };

  const description =
    project.shortDescription ??
    project.description?.slice(0, 160) ??
    `Explore ${project.title}, a project by the A&A team.`;
  const imageUrl = safeExternalUrl(project.thumbnailUrl);

  return {
    title: project.title,
    description,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      title: `${project.title} | A&A Portfolio`,
      description,
      type: "article",
      url: `/projects/${project.slug}`,
      images: imageUrl?.startsWith("https://")
        ? [{ url: imageUrl, alt: `${project.title} project thumbnail` }]
        : undefined,
    },
    twitter: {
      card: imageUrl?.startsWith("https://") ? "summary_large_image" : "summary",
      title: `${project.title} | A&A Portfolio`,
      description,
      images: imageUrl?.startsWith("https://") ? [imageUrl] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  return <ProjectDetail project={project} />;
}
