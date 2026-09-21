"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminMemberDeleteSchema,
  adminMemberUpdateSchema,
  readAdminMemberDeleteForm,
  readAdminMemberUpdateForm,
  toAdminMemberUpdate,
} from "@/features/admin/member-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type MemberAdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function validationFailure(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): MemberAdminActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function logMemberFailure(action: string, actorUserId: string, error: unknown) {
  console.error("Administrator Member operation failed", {
    action,
    actorUserId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

function revalidateMemberPages(memberId: string, oldSlug: string, newSlug?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/members");
  revalidatePath(`/members/${oldSlug}`);
  if (newSlug && newSlug !== oldSlug) {
    revalidatePath(`/members/${newSlug}`);
  }
}

export async function updateMemberAsAdmin(
  _previousState: MemberAdminActionState,
  formData: FormData,
): Promise<MemberAdminActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = adminMemberUpdateSchema.safeParse(
    readAdminMemberUpdateForm(formData),
  );
  if (!parsed.success) return validationFailure(parsed.error);

  let previousSlug: string;
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const target = await transaction.member.findUnique({
        where: { id: parsed.data.memberId },
        select: {
          id: true,
          slug: true,
          user: { select: { id: true } },
        },
      });
      if (!target) return null;

      await transaction.member.update({
        where: { id: target.id },
        data: toAdminMemberUpdate(parsed.data),
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "MEMBER_PROFILE_UPDATED_BY_ADMIN",
          entityType: "Member",
          entityId: target.id,
          metadata: {
            ownerUserId: target.user.id,
            previousSlug: target.slug,
            nextSlug: parsed.data.slug,
            publicationState: parsed.data.isPublished ? "PUBLISHED" : "DRAFT",
            teamOrder: parsed.data.teamOrder,
          },
        },
      });

      return target.slug;
    });

    if (!outcome) {
      return { status: "error", message: "That Member profile is no longer available." };
    }
    previousSlug = outcome;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: "That public slug is already in use.",
        fieldErrors: { slug: ["Choose a unique public slug."] },
      };
    }
    logMemberFailure("updateMemberAsAdmin", administrator.id, error);
    return {
      status: "error",
      message: "The Member profile could not be saved. Please try again.",
    };
  }

  revalidateMemberPages(parsed.data.memberId, previousSlug, parsed.data.slug);
  return {
    status: "success",
    message: parsed.data.isPublished
      ? "Member profile saved and published."
      : "Member profile saved as a draft.",
  };
}

export async function deleteMemberProfileAsAdmin(
  _previousState: MemberAdminActionState,
  formData: FormData,
): Promise<MemberAdminActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = adminMemberDeleteSchema.safeParse(
    readAdminMemberDeleteForm(formData),
  );
  if (!parsed.success) return validationFailure(parsed.error);

  let deletedSlug: string;
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const target = await transaction.member.findUnique({
        where: { id: parsed.data.memberId },
        select: {
          id: true,
          slug: true,
          user: {
            select: {
              id: true,
              role: true,
              isActive: true,
            },
          },
        },
      });
      if (!target) return { status: "NOT_FOUND" as const };
      if (parsed.data.confirmation !== target.slug) {
        return { status: "CONFIRMATION_MISMATCH" as const };
      }
      if (target.user.role === "MEMBER" && target.user.isActive) {
        return { status: "ACTIVE_MEMBER" as const };
      }

      await transaction.member.delete({ where: { id: target.id } });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "MEMBER_PROFILE_DELETED",
          entityType: "Member",
          entityId: target.id,
          metadata: {
            slug: target.slug,
            ownerUserId: target.user.id,
            ownerAccountRetained: true,
          },
        },
      });

      return { status: "DELETED" as const, slug: target.slug };
    });

    if (outcome.status === "NOT_FOUND") {
      return { status: "error", message: "That Member profile is no longer available." };
    }
    if (outcome.status === "CONFIRMATION_MISMATCH") {
      return {
        status: "error",
        message: "The confirmation did not match the current public slug.",
        fieldErrors: { confirmation: ["Type the current public slug exactly."] },
      };
    }
    if (outcome.status === "ACTIVE_MEMBER") {
      return {
        status: "error",
        message:
          "Deactivate this MEMBER account before deleting its profile. Deactivation and profile deletion are separate actions.",
      };
    }
    deletedSlug = outcome.slug;
  } catch (error) {
    logMemberFailure("deleteMemberProfileAsAdmin", administrator.id, error);
    return {
      status: "error",
      message: "The Member profile could not be deleted. Please try again.",
    };
  }

  revalidateMemberPages(parsed.data.memberId, deletedSlug);
  redirect("/admin/members?profileDeleted=1");
}
