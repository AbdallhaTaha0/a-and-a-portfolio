import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getTeamAccounts() {
  const [accounts, activeAdministratorCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        member: {
          select: {
            slug: true,
            fullName: true,
            isPublished: true,
          },
        },
        _count: { select: { accounts: true } },
      },
    }),
    prisma.user.count({ where: { role: "TEAM_ADMIN", isActive: true } }),
  ]);

  return { accounts, activeAdministratorCount };
}
