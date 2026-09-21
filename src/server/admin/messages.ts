import "server-only"; import { prisma } from "@/server/db/prisma";
export async function getAdminContactMessages() { return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, subject: true, message: true, status: true, createdAt: true, member: { select: { fullName: true, slug: true } } } }); }
