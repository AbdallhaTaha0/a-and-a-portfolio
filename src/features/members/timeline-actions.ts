"use server";

import { revalidatePath } from "next/cache";

import {
  educationSchema,
  experienceSchema,
  readEducationFormData,
  readExperienceFormData,
  toEducationData,
  toExperienceData,
} from "@/features/members/timeline-schema";
import { requireCurrentMember } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type TimelineActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function revalidateTimeline(slug: string, area: "education" | "experience") {
  revalidatePath(`/admin/profile/${area}`);
  revalidatePath(`/members/${slug}`);
}

function safeFailure(message: string): TimelineActionState {
  return { status: "error", message };
}

function logTimelineFailure(
  action: string,
  error: unknown,
  identity: { userId: string; memberId: string; recordId?: string },
) {
  console.error("Member timeline operation failed", {
    action,
    ...identity,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

export async function createEducation(
  _previousState: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  const { user, member } = await requireCurrentMember();
  const parsed = educationSchema.safeParse(readEducationFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const ordering = await transaction.education.aggregate({
        where: { memberId: member.id },
        _max: { sortOrder: true },
      });
      const record = await transaction.education.create({
        data: {
          memberId: member.id,
          sortOrder: (ordering._max.sortOrder ?? -1) + 1,
          ...toEducationData(parsed.data),
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EDUCATION_CREATED",
          entityType: "Education",
          entityId: record.id,
        },
      });
    });
  } catch (error) {
    logTimelineFailure("createEducation", error, {
      userId: user.id,
      memberId: member.id,
    });
    return safeFailure("The education entry could not be added. Please try again.");
  }

  revalidateTimeline(member.slug, "education");
  return { status: "success", message: "Education entry added." };
}

export async function updateEducation(
  recordId: string,
  _previousState: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  const { user, member } = await requireCurrentMember();
  const parsed = educationSchema.safeParse(readEducationFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const found = await prisma.$transaction(async (transaction) => {
      const result = await transaction.education.updateMany({
        where: { id: recordId, memberId: member.id },
        data: toEducationData(parsed.data),
      });
      if (result.count !== 1) return false;

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EDUCATION_UPDATED",
          entityType: "Education",
          entityId: recordId,
        },
      });
      return true;
    });

    if (!found) {
      return safeFailure("That education entry is no longer available.");
    }
  } catch (error) {
    logTimelineFailure("updateEducation", error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return safeFailure("The education entry could not be saved. Please try again.");
  }

  revalidateTimeline(member.slug, "education");
  return { status: "success", message: "Education entry saved." };
}

export async function deleteEducation(
  recordId: string,
  _previousState: TimelineActionState,
  _formData: FormData,
): Promise<TimelineActionState> {
  void _previousState;
  void _formData;
  const { user, member } = await requireCurrentMember();

  try {
    const found = await prisma.$transaction(async (transaction) => {
      const result = await transaction.education.deleteMany({
        where: { id: recordId, memberId: member.id },
      });
      if (result.count !== 1) return false;

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EDUCATION_DELETED",
          entityType: "Education",
          entityId: recordId,
        },
      });
      return true;
    });

    if (!found) {
      return safeFailure("That education entry is no longer available.");
    }
  } catch (error) {
    logTimelineFailure("deleteEducation", error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return safeFailure("The education entry could not be removed. Please try again.");
  }

  revalidateTimeline(member.slug, "education");
  return { status: "success", message: "Education entry removed." };
}

export async function createExperience(
  _previousState: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  const { user, member } = await requireCurrentMember();
  const parsed = experienceSchema.safeParse(readExperienceFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const ordering = await transaction.experience.aggregate({
        where: { memberId: member.id },
        _max: { sortOrder: true },
      });
      const record = await transaction.experience.create({
        data: {
          memberId: member.id,
          sortOrder: (ordering._max.sortOrder ?? -1) + 1,
          ...toExperienceData(parsed.data),
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EXPERIENCE_CREATED",
          entityType: "Experience",
          entityId: record.id,
        },
      });
    });
  } catch (error) {
    logTimelineFailure("createExperience", error, {
      userId: user.id,
      memberId: member.id,
    });
    return safeFailure("The experience entry could not be added. Please try again.");
  }

  revalidateTimeline(member.slug, "experience");
  return { status: "success", message: "Experience entry added." };
}

export async function updateExperience(
  recordId: string,
  _previousState: TimelineActionState,
  formData: FormData,
): Promise<TimelineActionState> {
  const { user, member } = await requireCurrentMember();
  const parsed = experienceSchema.safeParse(readExperienceFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const found = await prisma.$transaction(async (transaction) => {
      const result = await transaction.experience.updateMany({
        where: { id: recordId, memberId: member.id },
        data: toExperienceData(parsed.data),
      });
      if (result.count !== 1) return false;

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EXPERIENCE_UPDATED",
          entityType: "Experience",
          entityId: recordId,
        },
      });
      return true;
    });

    if (!found) {
      return safeFailure("That experience entry is no longer available.");
    }
  } catch (error) {
    logTimelineFailure("updateExperience", error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return safeFailure("The experience entry could not be saved. Please try again.");
  }

  revalidateTimeline(member.slug, "experience");
  return { status: "success", message: "Experience entry saved." };
}

export async function deleteExperience(
  recordId: string,
  _previousState: TimelineActionState,
  _formData: FormData,
): Promise<TimelineActionState> {
  void _previousState;
  void _formData;
  const { user, member } = await requireCurrentMember();

  try {
    const found = await prisma.$transaction(async (transaction) => {
      const result = await transaction.experience.deleteMany({
        where: { id: recordId, memberId: member.id },
      });
      if (result.count !== 1) return false;

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "EXPERIENCE_DELETED",
          entityType: "Experience",
          entityId: recordId,
        },
      });
      return true;
    });

    if (!found) {
      return safeFailure("That experience entry is no longer available.");
    }
  } catch (error) {
    logTimelineFailure("deleteExperience", error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return safeFailure("The experience entry could not be removed. Please try again.");
  }

  revalidateTimeline(member.slug, "experience");
  return { status: "success", message: "Experience entry removed." };
}
