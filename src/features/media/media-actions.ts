"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCurrentMember, requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import {
  deleteMediaIfUnreferenced,
  deleteUploadedBlob,
  uploadImage,
  validateImageFile,
  type ImageFolder,
} from "@/server/media/storage";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { checkAdminMutationLimit } from "@/server/security/admin-rate-limit";

export type MediaActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const uploadTargetSchema = z.discriminatedUnion("target", [
  z.object({ target: z.literal("profile") }),
  z.object({
    target: z.literal("personal-project-thumbnail"),
    recordId: z.string().trim().min(1).max(64),
  }),
  z.object({
    target: z.literal("team-project-thumbnail"),
    recordId: z.string().trim().min(1).max(64),
  }),
  z.object({
    target: z.literal("team-project-gallery"),
    recordId: z.string().trim().min(1).max(64),
    altText: z.string().trim().min(2, "Describe the image.").max(320),
  }),
]);

const galleryDeleteSchema = z.object({
  imageId: z.string().trim().min(1).max(64),
});

function failure(message: string, field?: string): MediaActionState {
  return {
    status: "error",
    message,
    fieldErrors: field ? { [field]: [message] } : undefined,
  };
}

function readUploadTarget(formData: FormData) {
  return {
    target: formData.get("target"),
    recordId: formData.get("recordId"),
    altText: formData.get("altText"),
  };
}

export async function uploadMedia(
  _previousState: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  void _previousState;
  const parsed = uploadTargetSchema.safeParse(readUploadTarget(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "The upload target is invalid.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) return failure("Choose an image to upload.", "file");
  const validation = await validateImageFile(fileValue);
  if (!validation.success) return failure(validation.message, "file");

  let actorUserId: string;
  let ownerId: string;
  let folder: ImageFolder;
  let width: number;
  let oldUrl: string | null = null;
  let publicSlug: string | null = null;

  if (parsed.data.target === "profile") {
    const { user, member } = await requireCurrentMember();
    actorUserId = user.id;
    ownerId = member.id;
    folder = "profiles";
    width = 1200;
    oldUrl = member.profileImageUrl;
    publicSlug = member.slug;
  } else if (parsed.data.target === "personal-project-thumbnail") {
    const { user, member } = await requireCurrentMember();
    const project = await prisma.personalProject.findFirst({
      where: { id: parsed.data.recordId, memberId: member.id },
      select: { id: true, thumbnailUrl: true },
    });
    if (!project) return failure("That personal project is no longer available.");
    actorUserId = user.id;
    ownerId = project.id;
    folder = "personal-projects";
    width = 1600;
    oldUrl = project.thumbnailUrl;
    publicSlug = member.slug;
  } else {
    const administrator = await requireTeamAdmin();
    const project = await prisma.project.findUnique({
      where: { id: parsed.data.recordId },
      select: { id: true, slug: true, thumbnailUrl: true },
    });
    if (!project) return failure("That team project is no longer available.");
    actorUserId = administrator.id;
    ownerId = project.id;
    folder =
      parsed.data.target === "team-project-gallery"
        ? "team-project-galleries"
        : "team-projects";
    width = parsed.data.target === "team-project-gallery" ? 2000 : 1600;
    oldUrl =
      parsed.data.target === "team-project-thumbnail" ? project.thumbnailUrl : null;
    publicSlug = project.slug;
  }

  try {
    const rateLimit = await consumeRateLimit({
      scope: "media-upload",
      identifier: actorUserId,
      limit: 20,
      windowMs: 10 * 60 * 1_000,
    });

    if (!rateLimit.allowed) {
      return failure(
        `Too many uploads. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
        "file",
      );
    }
  } catch (error) {
    console.error("Media rate limiter failed", {
      actorUserId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return failure("Upload protection is temporarily unavailable. Please try again.");
  }

  let uploaded: Awaited<ReturnType<typeof uploadImage>>;
  try {
    uploaded = await uploadImage({ file: fileValue, folder, ownerId, width });
  } catch (error) {
    console.error("Media upload failed", {
      actorUserId,
      target: parsed.data.target,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return failure(
      error instanceof Error &&
        (error.message.startsWith("Images must") || error.message.startsWith("The image"))
        ? error.message
        : "The image could not be uploaded. Check storage configuration and try again.",
      "file",
    );
  }

  try {
    const saved = await prisma.$transaction(async (transaction) => {
      const media = await transaction.media.create({
        data: { ...uploaded, uploadedByUserId: actorUserId },
        select: { id: true },
      });

      let applied = false;
      let entityType = "Media";
      let entityId = media.id;

      if (parsed.data.target === "profile") {
        const result = await transaction.member.updateMany({
          where: { id: ownerId, userId: actorUserId },
          data: { profileImageUrl: uploaded.url },
        });
        applied = result.count === 1;
        entityType = "Member";
        entityId = ownerId;
      } else if (parsed.data.target === "personal-project-thumbnail") {
        const result = await transaction.personalProject.updateMany({
          where: { id: ownerId, member: { userId: actorUserId } },
          data: { thumbnailUrl: uploaded.url },
        });
        applied = result.count === 1;
        entityType = "PersonalProject";
        entityId = ownerId;
      } else if (parsed.data.target === "team-project-thumbnail") {
        const result = await transaction.project.updateMany({
          where: { id: ownerId },
          data: { thumbnailUrl: uploaded.url },
        });
        applied = result.count === 1;
        entityType = "Project";
        entityId = ownerId;
      } else {
        const project = await transaction.project.findUnique({
          where: { id: ownerId },
          select: { id: true },
        });
        if (project) {
          const ordering = await transaction.projectImage.aggregate({
            where: { projectId: ownerId },
            _max: { sortOrder: true },
          });
          const image = await transaction.projectImage.create({
            data: {
              projectId: ownerId,
              url: uploaded.url,
              altText: parsed.data.altText,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
            },
            select: { id: true },
          });
          applied = true;
          entityType = "ProjectImage";
          entityId = image.id;
        }
      }

      if (!applied) throw new Error("MEDIA_TARGET_MISSING");
      await transaction.auditLog.create({
        data: {
          userId: actorUserId,
          action: "MEDIA_UPLOADED",
          entityType,
          entityId,
          metadata: { mediaId: media.id, target: parsed.data.target },
        },
      });
      return true;
    });
    if (!saved) throw new Error("MEDIA_TARGET_MISSING");
  } catch (error) {
    try {
      await deleteUploadedBlob(uploaded.storageKey);
    } catch (cleanupError) {
      console.error("Failed to roll back unattached media", {
        storageKey: uploaded.storageKey,
        errorName: cleanupError instanceof Error ? cleanupError.name : "UnknownError",
      });
    }
    console.error("Media database attachment failed", {
      actorUserId,
      target: parsed.data.target,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return failure("The uploaded image could not be attached. Please try again.");
  }

  if (oldUrl && oldUrl !== uploaded.url) await deleteMediaIfUnreferenced(oldUrl);

  revalidatePath("/");
  if (parsed.data.target === "profile") {
    revalidatePath("/admin/profile");
    revalidatePath("/admin/profile/preview");
    if (publicSlug) revalidatePath(`/members/${publicSlug}`);
  } else if (parsed.data.target === "personal-project-thumbnail") {
    revalidatePath("/admin/profile/projects");
    revalidatePath("/admin/profile/preview");
    if (publicSlug) revalidatePath(`/members/${publicSlug}`);
  } else {
    revalidatePath(`/admin/projects/${ownerId}`);
    revalidatePath("/projects");
    if (publicSlug) revalidatePath(`/projects/${publicSlug}`);
  }

  return { status: "success", message: "Image uploaded and attached." };
}

export async function deleteProjectGalleryImage(
  _previousState: MediaActionState,
  formData: FormData,
): Promise<MediaActionState> {
  void _previousState;
  const administrator = await requireTeamAdmin();
  const parsed = galleryDeleteSchema.safeParse({ imageId: formData.get("imageId") });
  if (!parsed.success) return failure("That gallery image is unavailable.");
  const limitError = await checkAdminMutationLimit(administrator.id);
  if (limitError) return failure(limitError);

  const deleted = await prisma.$transaction(async (transaction) => {
    const image = await transaction.projectImage.findUnique({
      where: { id: parsed.data.imageId },
      select: { id: true, url: true, projectId: true, project: { select: { slug: true } } },
    });
    if (!image) return null;
    await transaction.projectImage.delete({ where: { id: image.id } });
    await transaction.auditLog.create({
      data: {
        userId: administrator.id,
        action: "PROJECT_IMAGE_DELETED",
        entityType: "ProjectImage",
        entityId: image.id,
        metadata: { projectId: image.projectId },
      },
    });
    return image;
  });

  if (!deleted) return failure("That gallery image is no longer available.");
  await deleteMediaIfUnreferenced(deleted.url);
  revalidatePath(`/admin/projects/${deleted.projectId}`);
  revalidatePath(`/projects/${deleted.project.slug}`);
  return { status: "success", message: "Gallery image removed." };
}
