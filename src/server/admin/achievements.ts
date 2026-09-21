import "server-only";
import { prisma } from "@/server/db/prisma";
export async function getAdminTeamAchievements() { return prisma.teamAchievement.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }], take: 100, select: { id: true, title: true, description: true, issuer: true, date: true, imageUrl: true, url: true, sortOrder: true } }); }
