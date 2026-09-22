import "server-only";

import type { Prisma } from "@prisma/client";
import { connection } from "next/server";
import { cache } from "react";

import { prisma } from "@/server/db/prisma";

const projectCardSelect = {
  slug: true,
  title: true,
  shortDescription: true,
  thumbnailUrl: true,
  status: true,
  isFeatured: true,
  technologies: {
    orderBy: { technology: { name: "asc" as const } },
    select: { technology: { select: { name: true } } },
  },
} as const;

export async function getPublishedProjects() {
  await connection();
  return prisma.project.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    select: projectCardSelect,
  });
}

export async function getFeaturedProjects() {
  await connection();
  return prisma.project.findMany({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    take: 3,
    select: projectCardSelect,
  });
}

export async function getPublishedProjectSitemapEntries() {
  await connection();

  return prisma.project.findMany({
    where: { isPublished: true },
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      updatedAt: true,
      thumbnailUrl: true,
    },
  });
}

async function getProjectDetail(where: Prisma.ProjectWhereInput) {
  await connection();
  const project = await prisma.project.findFirst({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      description: true,
      thumbnailUrl: true,
      githubUrl: true,
      liveUrl: true,
      status: true,
      startDate: true,
      endDate: true,
      isFeatured: true,
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { url: true, altText: true },
      },
      technologies: {
        orderBy: { technology: { name: "asc" } },
        select: {
          technologyId: true,
          technology: { select: { name: true, category: true } },
        },
      },
      members: {
        where: { member: { isPublished: true } },
        orderBy: { member: { teamOrder: "asc" } },
        select: {
          role: true,
          contribution: true,
          member: {
            select: {
              slug: true,
              fullName: true,
              headline: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  });

  if (!project) return null;

  const technologyIds = project.technologies.map(({ technologyId }) => technologyId);
  const relatedProjects = await prisma.project.findMany({
    where: {
      id: { not: project.id },
      isPublished: true,
      ...(technologyIds.length
        ? { technologies: { some: { technologyId: { in: technologyIds } } } }
        : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    take: 3,
    select: projectCardSelect,
  });

  return { ...project, relatedProjects };
}

export const getPublishedProjectBySlug = cache((slug: string) =>
  getProjectDetail({ slug, isPublished: true }),
);

export async function getProjectPreviewById(projectId: string) {
  return getProjectDetail({ id: projectId });
}

export type ProjectDetailData = NonNullable<
  Awaited<ReturnType<typeof getPublishedProjectBySlug>>
>;
