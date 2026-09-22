"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  projectCreateSchema,
  projectDeleteSchema,
  projectUpdateSchema,
  readProjectCreateForm,
  readProjectDeleteForm,
  readProjectUpdateForm,
  toProjectData,
} from "@/features/projects/project-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { checkAdminMutationLimit } from "@/server/security/admin-rate-limit";
import {
  deleteMediaIfUnreferenced,
  deleteMediaListIfUnreferenced,
} from "@/server/media/storage";

export type ProjectActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function validationFailure(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): ProjectActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function conflictFailure(error: unknown): ProjectActionState | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      status: "error",
      message: "That project slug is already in use.",
      fieldErrors: { slug: ["Choose a unique project slug."] },
    };
  }
  return null;
}

function logProjectFailure(action: string, actorUserId: string, error: unknown) {
  console.error("Administrator project operation failed", {
    action,
    actorUserId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

function revalidateProjectPages(projectId?: string, oldSlug?: string, newSlug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  if (projectId) revalidatePath(`/admin/projects/${projectId}`);
  if (oldSlug) revalidatePath(`/projects/${oldSlug}`);
  if (newSlug && newSlug !== oldSlug) revalidatePath(`/projects/${newSlug}`);
}

export async function createProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = projectCreateSchema.safeParse(readProjectCreateForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let projectId: string;
  try {
    const project = await prisma.$transaction(async (transaction) => {
      const created = await transaction.project.create({
        data: toProjectData(parsed.data),
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "PROJECT_CREATED",
          entityType: "Project",
          entityId: created.id,
          metadata: { slug: parsed.data.slug },
        },
      });
      return created;
    });
    projectId = project.id;
  } catch (error) {
    const conflict = conflictFailure(error);
    if (conflict) return conflict;
    logProjectFailure("createProject", administrator.id, error);
    return { status: "error", message: "The project could not be created. Please try again." };
  }

  revalidateProjectPages(projectId, undefined, parsed.data.slug);
  return {
    status: "success",
    message: parsed.data.isPublished
      ? "Project created and published."
      : "Project created as a draft.",
  };
}

export async function updateProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = projectUpdateSchema.safeParse(readProjectUpdateForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let oldSlug: string;
  let oldThumbnailUrl: string | null;
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const target = await transaction.project.findUnique({
        where: { id: parsed.data.projectId },
        select: { id: true, slug: true, thumbnailUrl: true },
      });
      if (!target) return null;
      await transaction.project.update({
        where: { id: target.id },
        data: toProjectData(parsed.data),
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "PROJECT_UPDATED",
          entityType: "Project",
          entityId: target.id,
          metadata: {
            previousSlug: target.slug,
            nextSlug: parsed.data.slug,
            publicationState: parsed.data.isPublished ? "PUBLISHED" : "DRAFT",
            featured: parsed.data.isFeatured,
          },
        },
      });
      return { slug: target.slug, thumbnailUrl: target.thumbnailUrl };
    });
    if (!outcome) return { status: "error", message: "That project is no longer available." };
    oldSlug = outcome.slug;
    oldThumbnailUrl = outcome.thumbnailUrl;
  } catch (error) {
    const conflict = conflictFailure(error);
    if (conflict) return conflict;
    logProjectFailure("updateProject", administrator.id, error);
    return { status: "error", message: "The project could not be saved. Please try again." };
  }

  revalidateProjectPages(parsed.data.projectId, oldSlug, parsed.data.slug);
  if (
    oldThumbnailUrl &&
    oldThumbnailUrl !== (parsed.data.thumbnailUrl ?? null)
  ) {
    await deleteMediaIfUnreferenced(oldThumbnailUrl);
  }
  return {
    status: "success",
    message: parsed.data.isPublished ? "Project saved and published." : "Project draft saved.",
  };
}

export async function deleteProject(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = projectDeleteSchema.safeParse(readProjectDeleteForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const limitError = await checkAdminMutationLimit(administrator.id);
  if (limitError) return { status: "error", message: limitError };

  let deletedSlug: string;
  let deletedMediaUrls: string[] = [];
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const target = await transaction.project.findUnique({
        where: { id: parsed.data.projectId },
        select: {
          id: true,
          slug: true,
          thumbnailUrl: true,
          images: { select: { url: true } },
        },
      });
      if (!target) return { status: "NOT_FOUND" as const };
      if (parsed.data.confirmation !== target.slug) {
        return { status: "CONFIRMATION_MISMATCH" as const };
      }
      await transaction.project.delete({ where: { id: target.id } });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "PROJECT_DELETED",
          entityType: "Project",
          entityId: target.id,
          metadata: { slug: target.slug },
        },
      });
      return {
        status: "DELETED" as const,
        slug: target.slug,
        mediaUrls: [target.thumbnailUrl, ...target.images.map(({ url }) => url)].filter(
          (url): url is string => Boolean(url),
        ),
      };
    });
    if (outcome.status === "NOT_FOUND") {
      return { status: "error", message: "That project is no longer available." };
    }
    if (outcome.status === "CONFIRMATION_MISMATCH") {
      return {
        status: "error",
        message: "The confirmation did not match the current project slug.",
        fieldErrors: { confirmation: ["Type the current project slug exactly."] },
      };
    }
    deletedSlug = outcome.slug;
    deletedMediaUrls = outcome.mediaUrls;
  } catch (error) {
    logProjectFailure("deleteProject", administrator.id, error);
    return { status: "error", message: "The project could not be deleted. Please try again." };
  }

  revalidateProjectPages(parsed.data.projectId, deletedSlug);
  await deleteMediaListIfUnreferenced(deletedMediaUrls);
  redirect("/admin/projects?projectDeleted=1");
}
