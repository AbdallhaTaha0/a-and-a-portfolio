import "server-only"; import { prisma } from "@/server/db/prisma";
export async function getAdminTestimonials() { return prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 100, select: { id: true, name: true, role: true, company: true, content: true, avatarUrl: true, isPublished: true, sortOrder: true } }); }
