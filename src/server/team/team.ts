import "server-only";

import { connection } from "next/server";

import { PRIMARY_TEAM_SLUG } from "@/features/team/constants";
import { prisma } from "@/server/db/prisma";

const publicTeamSelect = {
  name: true,
  shortDescription: true,
  description: true,
  contactEmail: true,
  location: true,
  githubUrl: true,
  linkedinUrl: true,
} as const;

export async function getPublicTeam() {
  await connection();

  return prisma.team.findUnique({
    where: { slug: PRIMARY_TEAM_SLUG },
    select: publicTeamSelect,
  });
}

export async function getEditableTeam() {
  return prisma.team.findUnique({
    where: { slug: PRIMARY_TEAM_SLUG },
    select: {
      id: true,
      ...publicTeamSelect,
    },
  });
}
