import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getAdminMemberSummaries() {
  return prisma.member.findMany({
    orderBy: [{ teamOrder: "asc" }, { fullName: "asc" }],
    take: 100,
    select: {
      id: true,
      slug: true,
      fullName: true,
      headline: true,
      isPublished: true,
      teamOrder: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });
}

export async function getAdminMemberById(memberId: string) {
  return prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      slug: true,
      fullName: true,
      headline: true,
      bio: true,
      profileImageUrl: true,
      location: true,
      phone: true,
      publicEmail: true,
      isPublished: true,
      teamOrder: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          education: true,
          experience: true,
          skills: true,
          certifications: true,
          achievements: true,
          socialLinks: true,
          personalProjects: true,
          projectMemberships: true,
        },
      },
    },
  });
}
