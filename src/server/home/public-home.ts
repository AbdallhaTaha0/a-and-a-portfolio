import "server-only";

import { connection } from "next/server";

import { prisma } from "@/server/db/prisma";

export async function getPublicHomeHighlights() {
  await connection();

  const [members, technologies, achievements, testimonials] = await Promise.all([
    prisma.member.findMany({
      where: { isPublished: true },
      orderBy: [{ teamOrder: "asc" }, { fullName: "asc" }],
      take: 6,
      select: {
        slug: true,
        fullName: true,
        headline: true,
        profileImageUrl: true,
      },
    }),
    prisma.technology.findMany({
      where: { projects: { some: { project: { isPublished: true } } } },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 24,
      select: { name: true, category: true },
    }),
    prisma.teamAchievement.findMany({
      orderBy: [{ sortOrder: "asc" }, { date: "desc" }, { title: "asc" }],
      take: 6,
      select: {
        title: true,
        description: true,
        issuer: true,
        date: true,
        url: true,
      },
    }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      take: 6,
      select: {
        name: true,
        role: true,
        company: true,
        content: true,
      },
    }),
  ]);

  return { members, technologies, achievements, testimonials };
}
