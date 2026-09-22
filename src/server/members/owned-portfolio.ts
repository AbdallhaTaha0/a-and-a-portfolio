import "server-only";

import type {
  PortfolioItem,
  PortfolioKind,
} from "@/features/members/portfolio-schema";
import { prisma } from "@/server/db/prisma";

function dateInput(date: Date | null) {
  return date?.toISOString().slice(0, 10) ?? null;
}

export async function getOwnPortfolio(
  memberId: string,
  kind: PortfolioKind,
): Promise<PortfolioItem[]> {
  switch (kind) {
    case "skills": {
      const records = await prisma.memberSkill.findMany({
        where: { memberId },
        orderBy: [{ sortOrder: "asc" }, { skill: { name: "asc" } }],
        select: {
          skillId: true,
          proficiency: true,
          skill: { select: { name: true, category: true } },
        },
      });
      return records.map((record) => ({
        id: record.skillId,
        name: record.skill.name,
        category: record.skill.category,
        proficiency: record.proficiency,
      }));
    }
    case "certifications": {
      const records = await prisma.certification.findMany({
        where: { memberId },
        orderBy: [{ sortOrder: "asc" }, { issueDate: "desc" }],
        select: {
          id: true,
          name: true,
          issuer: true,
          description: true,
          issueDate: true,
          expirationDate: true,
          credentialUrl: true,
        },
      });
      return records.map((record) => ({
        ...record,
        issueDate: dateInput(record.issueDate)!,
        expirationDate: dateInput(record.expirationDate),
      }));
    }
    case "achievements": {
      const records = await prisma.achievement.findMany({
        where: { memberId },
        orderBy: [{ sortOrder: "asc" }, { date: "desc" }],
        select: {
          id: true,
          title: true,
          description: true,
          issuer: true,
          date: true,
          url: true,
        },
      });
      return records.map((record) => ({ ...record, date: dateInput(record.date) }));
    }
    case "projects": {
      const records = await prisma.personalProject.findMany({
        where: { memberId },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          shortDescription: true,
          description: true,
          thumbnailUrl: true,
          githubUrl: true,
          liveUrl: true,
          startDate: true,
          endDate: true,
          isFeatured: true,
          isPublished: true,
        },
      });
      return records.map((record) => ({
        ...record,
        startDate: dateInput(record.startDate),
        endDate: dateInput(record.endDate),
      }));
    }
    case "links":
      return prisma.socialLink.findMany({
        where: { memberId },
        orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
        select: { id: true, platform: true, url: true },
      });
  }
}
