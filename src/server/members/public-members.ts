import "server-only";

import { cache } from "react";

import { prisma } from "@/server/db/prisma";

export async function getPublishedMembers() {
  return prisma.member.findMany({
    where: { isPublished: true },
    orderBy: [{ teamOrder: "asc" }, { fullName: "asc" }],
    select: {
      slug: true,
      fullName: true,
      headline: true,
      profileImageUrl: true,
      location: true,
      skills: {
        orderBy: { sortOrder: "asc" },
        take: 4,
        select: { skill: { select: { name: true } } },
      },
    },
  });
}

export const getPublishedMemberBySlug = cache(async (slug: string) =>
  prisma.member.findFirst({
    where: { slug, isPublished: true },
    select: {
      slug: true,
      fullName: true,
      headline: true,
      bio: true,
      profileImageUrl: true,
      location: true,
      publicEmail: true,
      education: {
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
        select: {
          institution: true,
          degree: true,
          fieldOfStudy: true,
          description: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
      },
      experience: {
        orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
        select: {
          company: true,
          position: true,
          description: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
      },
      skills: {
        orderBy: { sortOrder: "asc" },
        select: {
          proficiency: true,
          skill: { select: { name: true } },
        },
      },
      certifications: {
        orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
        select: {
          name: true,
          issuer: true,
          description: true,
          issueDate: true,
          credentialUrl: true,
        },
      },
      achievements: {
        orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
        select: {
          title: true,
          description: true,
          issuer: true,
          date: true,
          url: true,
        },
      },
      socialLinks: {
        orderBy: { sortOrder: "asc" },
        select: { platform: true, url: true },
      },
      personalProjects: {
        where: { isPublished: true },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
        select: {
          title: true,
          slug: true,
          shortDescription: true,
          description: true,
          githubUrl: true,
          liveUrl: true,
          isFeatured: true,
        },
      },
    },
  }),
);
