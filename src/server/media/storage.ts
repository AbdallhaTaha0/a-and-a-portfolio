import "server-only";

import { randomUUID } from "node:crypto";

import { del, put } from "@vercel/blob";
import sharp from "sharp";

import { prisma } from "@/server/db/prisma";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageTypes = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
} as const;

export type ImageFolder =
  | "profiles"
  | "team-projects"
  | "team-project-galleries"
  | "personal-projects";

export type ImageValidationResult =
  | { success: true; extension: "jpg" | "png" | "webp" }
  | { success: false; message: string };

function matchesSignature(mimeType: keyof typeof imageTypes, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  return (
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (file.size <= 0) return { success: false, message: "Choose a non-empty image file." };
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, message: "Images must be 5 MB or smaller." };
  }

  if (!(file.type in imageTypes)) {
    return { success: false, message: "Use a JPEG, PNG, or WebP image." };
  }

  const mimeType = file.type as keyof typeof imageTypes;
  const suppliedExtension = file.name.split(".").pop()?.toLowerCase();
  if (!suppliedExtension || !imageTypes[mimeType].some((item) => item === suppliedExtension)) {
    return {
      success: false,
      message: "The filename extension does not match the image type.",
    };
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(mimeType, bytes)) {
    return {
      success: false,
      message: "The file contents do not match a supported image format.",
    };
  }

  return {
    success: true,
    extension:
      mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp",
  };
}

export async function uploadImage({
  file,
  folder,
  ownerId,
  width,
}: {
  file: File;
  folder: ImageFolder;
  ownerId: string;
  width: number;
}) {
  const validation = await validateImageFile(file);
  if (!validation.success) throw new Error(validation.message);

  const safeOwner = ownerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "unknown";
  const pathname = `${folder}/${safeOwner}/${randomUUID()}.webp`;
  const input = Buffer.from(await file.arrayBuffer());

  let optimized: Buffer;
  try {
    const decoder = sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
      sequentialRead: true,
    });
    const metadata = await decoder.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width < 32 ||
      metadata.height < 32 ||
      metadata.width > 12_000 ||
      metadata.height > 12_000
    ) {
      throw new Error("IMAGE_DIMENSIONS_INVALID");
    }
    optimized = await decoder
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    throw new Error(
      "The image could not be decoded safely. Use an image between 32 and 12,000 pixels per side.",
    );
  }

  const blob = await put(pathname, optimized, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 31_536_000,
    contentType: "image/webp",
  });

  return {
    url: blob.url,
    storageKey: blob.pathname,
    filename: file.name.slice(0, 255),
    mimeType: "image/webp",
    size: optimized.length,
  };
}

export async function deleteUploadedBlob(storageKey: string) {
  await del(storageKey);
}

export async function deleteMediaIfUnreferenced(url: string | null | undefined) {
  if (!url) return false;

  const media = await prisma.media.findFirst({
    where: { url },
    select: { id: true, storageKey: true },
  });
  if (!media) return false;

  const referenceCounts = await Promise.all([
    prisma.team.count({ where: { logoUrl: url } }),
    prisma.member.count({ where: { profileImageUrl: url } }),
    prisma.personalProject.count({ where: { thumbnailUrl: url } }),
    prisma.project.count({ where: { thumbnailUrl: url } }),
    prisma.achievement.count({ where: { imageUrl: url } }),
    prisma.teamAchievement.count({ where: { imageUrl: url } }),
    prisma.testimonial.count({ where: { avatarUrl: url } }),
    prisma.projectImage.count({ where: { url } }),
  ]);
  if (referenceCounts.some((count) => count > 0)) return false;

  try {
    await del(media.storageKey);
    await prisma.media.deleteMany({ where: { id: media.id, url } });
    return true;
  } catch (error) {
    console.error("Unused media cleanup failed", {
      mediaId: media.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
}

export async function deleteMediaListIfUnreferenced(urls: Array<string | null | undefined>) {
  await Promise.all([...new Set(urls.filter((url): url is string => Boolean(url)))].map(deleteMediaIfUnreferenced));
}
