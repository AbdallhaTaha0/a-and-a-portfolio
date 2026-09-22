import "server-only";

import { prisma } from "@/server/db/prisma";

export async function getOwnAccountSettings(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      accounts: {
        orderBy: { provider: "asc" },
        select: { provider: true },
      },
    },
  });
}
