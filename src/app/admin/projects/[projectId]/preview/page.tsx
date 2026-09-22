import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/projects/project-detail";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { getProjectPreviewById } from "@/server/projects/public-projects";

export const metadata: Metadata = {
  title: "Project preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminProjectPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  await requireTeamAdmin();
  const { projectId } = await params;
  const project = await getProjectPreviewById(projectId);
  if (!project) notFound();

  return <ProjectDetail preview project={project} />;
}
