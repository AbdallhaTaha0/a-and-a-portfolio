import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getAdminProjects() {
  return prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      status: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: true,
      updatedAt: true,
      _count: { select: { members: true, technologies: true, images: true } },
    },
  });
}

export async function getAdminProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      thumbnailUrl: true,
      githubUrl: true,
      liveUrl: true,
      status: true,
      startDate: true,
      endDate: true,
      isFeatured: true,
      isPublished: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { members: true, technologies: true, images: true } },
    },
  });
}
