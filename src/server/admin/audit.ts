import "server-only";
import { prisma } from "@/server/db/prisma";

export async function getRecentAuditLogs() {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });
}
