"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  projectTechnologySchema,
  readProjectTechnologyForm,
  readTechnologyDeleteForm,
  readTechnologyForm,
  readTechnologyUpdateForm,
  technologyCreateSchema,
  technologyDeleteSchema,
  technologyUpdateSchema,
} from "@/features/technologies/technology-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { checkAdminMutationLimit } from "@/server/security/admin-rate-limit";

export type TechnologyActionState = { status: "idle" | "success" | "error"; message: string; fieldErrors?: Record<string, string[]> };

const validationFailure = (error: { flatten(): { fieldErrors: Record<string, string[]> } }): TechnologyActionState => ({ status: "error", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors });
const technologyData = (input: { name: string; category?: string; iconUrl?: string }) => ({ name: input.name, category: input.category ?? null, iconUrl: input.iconUrl ?? null });

function conflictFailure(error: unknown): TechnologyActionState | null {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    ? { status: "error", message: "A technology with that name already exists.", fieldErrors: { name: ["Use a unique technology name."] } }
    : null;
}
function logFailure(action: string, actorUserId: string, error: unknown) {
  console.error("Technology operation failed", { action, actorUserId, errorName: error instanceof Error ? error.name : "UnknownError" });
}
function revalidateTechnologyPages() {
  revalidatePath("/");
  revalidatePath("/admin/technologies");
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}
function revalidateProjectTechnologyPages(projectId: string, slug: string) {
  revalidateTechnologyPages();
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/projects/${slug}`);
}

export async function createTechnology(_state: TechnologyActionState, formData: FormData): Promise<TechnologyActionState> {
  const admin = await requireTeamAdmin();
  const parsed = technologyCreateSchema.safeParse(readTechnologyForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    await prisma.$transaction(async (tx) => {
      const technology = await tx.technology.create({ data: technologyData(parsed.data), select: { id: true } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "TECHNOLOGY_CREATED", entityType: "Technology", entityId: technology.id, metadata: { name: parsed.data.name } } });
    });
  } catch (error) {
    const conflict = conflictFailure(error); if (conflict) return conflict;
    logFailure("createTechnology", admin.id, error);
    return { status: "error", message: "The technology could not be created. Please try again." };
  }
  revalidateTechnologyPages();
  return { status: "success", message: "Technology created." };
}

export async function updateTechnology(_state: TechnologyActionState, formData: FormData): Promise<TechnologyActionState> {
  const admin = await requireTeamAdmin();
  const parsed = technologyUpdateSchema.safeParse(readTechnologyUpdateForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const found = await prisma.$transaction(async (tx) => {
      const target = await tx.technology.findUnique({ where: { id: parsed.data.technologyId }, select: { id: true, name: true } });
      if (!target) return false;
      await tx.technology.update({ where: { id: target.id }, data: technologyData(parsed.data) });
      await tx.auditLog.create({ data: { userId: admin.id, action: "TECHNOLOGY_UPDATED", entityType: "Technology", entityId: target.id, metadata: { previousName: target.name, nextName: parsed.data.name } } });
      return true;
    });
    if (!found) return { status: "error", message: "That technology is no longer available." };
  } catch (error) {
    const conflict = conflictFailure(error); if (conflict) return conflict;
    logFailure("updateTechnology", admin.id, error);
    return { status: "error", message: "The technology could not be saved. Please try again." };
  }
  revalidateTechnologyPages();
  return { status: "success", message: "Technology saved." };
}

export async function deleteTechnology(_state: TechnologyActionState, formData: FormData): Promise<TechnologyActionState> {
  const admin = await requireTeamAdmin();
  const parsed = technologyDeleteSchema.safeParse(readTechnologyDeleteForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const limitError = await checkAdminMutationLimit(admin.id);
  if (limitError) return { status: "error", message: limitError };
  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const target = await tx.technology.findUnique({ where: { id: parsed.data.technologyId }, select: { id: true, name: true, _count: { select: { projects: true } } } });
      if (!target) return "NOT_FOUND" as const;
      if (parsed.data.confirmation !== target.name) return "MISMATCH" as const;
      if (target._count.projects > 0) return "IN_USE" as const;
      await tx.technology.delete({ where: { id: target.id } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "TECHNOLOGY_DELETED", entityType: "Technology", entityId: target.id, metadata: { name: target.name } } });
      return "DELETED" as const;
    });
    if (outcome === "NOT_FOUND") return { status: "error", message: "That technology is no longer available." };
    if (outcome === "MISMATCH") return { status: "error", message: "The confirmation did not match the current technology name.", fieldErrors: { confirmation: ["Type the current technology name exactly."] } };
    if (outcome === "IN_USE") return { status: "error", message: "Remove this technology from every project before deleting it." };
  } catch (error) {
    logFailure("deleteTechnology", admin.id, error);
    return { status: "error", message: "The technology could not be deleted. Please try again." };
  }
  revalidateTechnologyPages();
  return { status: "success", message: "Technology deleted." };
}

export async function assignProjectTechnology(_state: TechnologyActionState, formData: FormData): Promise<TechnologyActionState> {
  const admin = await requireTeamAdmin();
  const parsed = projectTechnologySchema.safeParse(readProjectTechnologyForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [project, technology] = await Promise.all([
        tx.project.findUnique({ where: { id: parsed.data.projectId }, select: { id: true, slug: true } }),
        tx.technology.findUnique({ where: { id: parsed.data.technologyId }, select: { id: true } }),
      ]);
      if (!project || !technology) return null;
      await tx.projectTechnology.upsert({ where: { projectId_technologyId: { projectId: project.id, technologyId: technology.id } }, create: { projectId: project.id, technologyId: technology.id }, update: {} });
      await tx.auditLog.create({ data: { userId: admin.id, action: "PROJECT_TECHNOLOGY_ASSIGNED", entityType: "ProjectTechnology", entityId: `${project.id}:${technology.id}`, metadata: { projectId: project.id, technologyId: technology.id } } });
      return project.slug;
    });
    if (!result) return { status: "error", message: "The project or technology is no longer available." };
    revalidateProjectTechnologyPages(parsed.data.projectId, result);
  } catch (error) {
    logFailure("assignProjectTechnology", admin.id, error);
    return { status: "error", message: "The technology could not be assigned. Please try again." };
  }
  return { status: "success", message: "Technology assigned to the project." };
}

export async function removeProjectTechnology(_state: TechnologyActionState, formData: FormData): Promise<TechnologyActionState> {
  const admin = await requireTeamAdmin();
  const parsed = projectTechnologySchema.safeParse(readProjectTechnologyForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const limitError = await checkAdminMutationLimit(admin.id);
  if (limitError) return { status: "error", message: limitError };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.projectTechnology.findUnique({ where: { projectId_technologyId: parsed.data }, select: { projectId: true, technologyId: true, project: { select: { slug: true } } } });
      if (!target) return null;
      await tx.projectTechnology.delete({ where: { projectId_technologyId: { projectId: target.projectId, technologyId: target.technologyId } } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "PROJECT_TECHNOLOGY_REMOVED", entityType: "ProjectTechnology", entityId: `${target.projectId}:${target.technologyId}`, metadata: { projectId: target.projectId, technologyId: target.technologyId } } });
      return target.project.slug;
    });
    if (!result) return { status: "error", message: "That project technology assignment is no longer available." };
    revalidateProjectTechnologyPages(parsed.data.projectId, result);
  } catch (error) {
    logFailure("removeProjectTechnology", admin.id, error);
    return { status: "error", message: "The technology could not be removed. Please try again." };
  }
  return { status: "success", message: "Technology removed from the project." };
}
