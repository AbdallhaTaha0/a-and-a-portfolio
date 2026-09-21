import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getAdminTechnologies() {
  return prisma.technology.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 200,
    select: { id: true, name: true, category: true, iconUrl: true, _count: { select: { projects: true } } },
  });
}
