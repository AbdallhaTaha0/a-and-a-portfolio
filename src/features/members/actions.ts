"use server";

import { revalidatePath } from "next/cache";

import {
  memberProfileSchema,
  readMemberProfileFormData,
  toMemberProfileUpdate,
} from "@/features/members/profile-schema";
import { requireCurrentMember } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { deleteMediaIfUnreferenced } from "@/server/media/storage";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateOwnProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { user, member } = await requireCurrentMember();
  const parsed = memberProfileSchema.safeParse(
    readMemberProfileFormData(formData),
  );

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.$transaction([
      prisma.member.update({
        where: { id: member.id, userId: user.id },
        data: toMemberProfileUpdate(parsed.data),
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "MEMBER_PROFILE_UPDATED",
          entityType: "Member",
          entityId: member.id,
          metadata: {
            publicationState: parsed.data.isPublished ? "PUBLISHED" : "DRAFT",
          },
        },
      }),
    ]);
  } catch (error) {
    console.error("Failed to update member profile", {
      userId: user.id,
      memberId: member.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      status: "error",
      message: "Your profile could not be saved. Please try again.",
    };
  }

  revalidatePath("/admin/profile");
  revalidatePath("/members");
  revalidatePath(`/members/${member.slug}`);
  if (
    member.profileImageUrl &&
    member.profileImageUrl !== (parsed.data.profileImageUrl ?? null)
  ) {
    await deleteMediaIfUnreferenced(member.profileImageUrl);
  }

  return {
    status: "success",
    message: parsed.data.isPublished
      ? "Profile saved and published."
      : "Draft profile saved.",
  };
}
