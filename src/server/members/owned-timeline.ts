import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getOwnEducation(memberId: string) {
  return prisma.education.findMany({
    where: { memberId },
    orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    select: {
      id: true,
      institution: true,
      degree: true,
      fieldOfStudy: true,
      description: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
    },
  });
}

export async function getOwnExperience(memberId: string) {
  return prisma.experience.findMany({
    where: { memberId },
    orderBy: [{ sortOrder: "asc" }, { startDate: "desc" }],
    select: {
      id: true,
      company: true,
      position: true,
      description: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
    },
  });
}
