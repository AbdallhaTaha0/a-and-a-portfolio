"use server";

import { revalidatePath } from "next/cache";

import {
  memberAchievementSchema,
  personalProjectSchema,
  portfolioKinds,
  readPortfolioForm,
  certificationSchema,
  skillSchema,
  skillUpdateSchema,
  socialLinkSchema,
  toNullableDate,
  type PortfolioKind,
} from "@/features/members/portfolio-schema";
import { requireCurrentMember } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { deleteMediaIfUnreferenced } from "@/server/media/storage";

export type PortfolioActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

function isPortfolioKind(value: string): value is PortfolioKind {
  return portfolioKinds.some((kind) => kind === value);
}

const auditByKind: Record<
  PortfolioKind,
  { entityType: string; updated: string; deleted: string }
> = {
  skills: {
    entityType: "MemberSkill",
    updated: "MEMBER_SKILL_UPDATED",
    deleted: "MEMBER_SKILL_DELETED",
  },
  certifications: {
    entityType: "Certification",
    updated: "CERTIFICATION_UPDATED",
    deleted: "CERTIFICATION_DELETED",
  },
  achievements: {
    entityType: "Achievement",
    updated: "MEMBER_ACHIEVEMENT_UPDATED",
    deleted: "MEMBER_ACHIEVEMENT_DELETED",
  },
  projects: {
    entityType: "PersonalProject",
    updated: "PERSONAL_PROJECT_UPDATED",
    deleted: "PERSONAL_PROJECT_DELETED",
  },
  links: {
    entityType: "SocialLink",
    updated: "SOCIAL_LINK_UPDATED",
    deleted: "SOCIAL_LINK_DELETED",
  },
};

function failure(message: string): PortfolioActionState {
  return { status: "error", message };
}

function invalid(
  fieldErrors: Record<string, string[] | undefined>,
): PortfolioActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors,
  };
}

function revalidatePortfolio(slug: string, kind: PortfolioKind) {
  revalidatePath(`/admin/profile/${kind}`);
  revalidatePath(`/members/${slug}`);
}

function logFailure(
  operation: string,
  error: unknown,
  identity: { userId: string; memberId: string; recordId?: string },
) {
  console.error("Member portfolio operation failed", {
    operation,
    ...identity,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

function certificationData(input: {
  name: string;
  issuer: string;
  description?: string;
  issueDate: string;
  expirationDate?: string;
  credentialUrl?: string;
}) {
  return {
    name: input.name,
    issuer: input.issuer,
    description: input.description ?? null,
    issueDate: toNullableDate(input.issueDate)!,
    expirationDate: toNullableDate(input.expirationDate),
    credentialUrl: input.credentialUrl ?? null,
  };
}

function achievementData(input: {
  title: string;
  description: string;
  issuer?: string;
  date?: string;
  url?: string;
}) {
  return {
    title: input.title,
    description: input.description,
    issuer: input.issuer ?? null,
    date: toNullableDate(input.date),
    url: input.url ?? null,
  };
}

function projectData(input: {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  startDate?: string;
  endDate?: string;
  isFeatured: boolean;
  isPublished: boolean;
}) {
  return {
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    githubUrl: input.githubUrl ?? null,
    liveUrl: input.liveUrl ?? null,
    startDate: toNullableDate(input.startDate),
    endDate: toNullableDate(input.endDate),
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
  };
}

export async function createPortfolioEntry(
  kindValue: PortfolioKind,
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  void _previousState;
  if (!isPortfolioKind(kindValue)) return failure("That portfolio section is unavailable.");

  const { user, member } = await requireCurrentMember();
  const raw = readPortfolioForm(kindValue, formData);

  try {
    switch (kindValue) {
      case "skills": {
        const parsed = skillSchema.safeParse(raw);
        if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
        await prisma.$transaction(async (transaction) => {
          const ordering = await transaction.memberSkill.aggregate({
            where: { memberId: member.id },
            _max: { sortOrder: true },
          });
          const record = await transaction.memberSkill.create({
            data: {
              proficiency: parsed.data.proficiency ?? null,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
              member: { connect: { id: member.id } },
              skill: {
                connectOrCreate: {
                  where: { name: parsed.data.name },
                  create: {
                    name: parsed.data.name,
                    category: parsed.data.category ?? null,
                  },
                },
              },
            },
            select: { skillId: true },
          });
          await transaction.auditLog.create({
            data: {
              userId: user.id,
              action: "MEMBER_SKILL_CREATED",
              entityType: "MemberSkill",
              entityId: record.skillId,
            },
          });
        });
        break;
      }
      case "certifications": {
        const parsed = certificationSchema.safeParse(raw);
        if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
        await prisma.$transaction(async (transaction) => {
          const ordering = await transaction.certification.aggregate({
            where: { memberId: member.id },
            _max: { sortOrder: true },
          });
          const record = await transaction.certification.create({
            data: {
              memberId: member.id,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
              ...certificationData(parsed.data),
            },
            select: { id: true },
          });
          await transaction.auditLog.create({
            data: {
              userId: user.id,
              action: "CERTIFICATION_CREATED",
              entityType: "Certification",
              entityId: record.id,
            },
          });
        });
        break;
      }
      case "achievements": {
        const parsed = memberAchievementSchema.safeParse(raw);
        if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
        await prisma.$transaction(async (transaction) => {
          const ordering = await transaction.achievement.aggregate({
            where: { memberId: member.id },
            _max: { sortOrder: true },
          });
          const record = await transaction.achievement.create({
            data: {
              memberId: member.id,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
              ...achievementData(parsed.data),
            },
            select: { id: true },
          });
          await transaction.auditLog.create({
            data: {
              userId: user.id,
              action: "MEMBER_ACHIEVEMENT_CREATED",
              entityType: "Achievement",
              entityId: record.id,
            },
          });
        });
        break;
      }
      case "projects": {
        const parsed = personalProjectSchema.safeParse(raw);
        if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
        await prisma.$transaction(async (transaction) => {
          const ordering = await transaction.personalProject.aggregate({
            where: { memberId: member.id },
            _max: { sortOrder: true },
          });
          const record = await transaction.personalProject.create({
            data: {
              memberId: member.id,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
              ...projectData(parsed.data),
            },
            select: { id: true },
          });
          await transaction.auditLog.create({
            data: {
              userId: user.id,
              action: "PERSONAL_PROJECT_CREATED",
              entityType: "PersonalProject",
              entityId: record.id,
            },
          });
        });
        break;
      }
      case "links": {
        const parsed = socialLinkSchema.safeParse(raw);
        if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
        await prisma.$transaction(async (transaction) => {
          const ordering = await transaction.socialLink.aggregate({
            where: { memberId: member.id },
            _max: { sortOrder: true },
          });
          const record = await transaction.socialLink.create({
            data: {
              memberId: member.id,
              sortOrder: (ordering._max.sortOrder ?? -1) + 1,
              platform: parsed.data.platform,
              url: parsed.data.url,
            },
            select: { id: true },
          });
          await transaction.auditLog.create({
            data: {
              userId: user.id,
              action: "SOCIAL_LINK_CREATED",
              entityType: "SocialLink",
              entityId: record.id,
            },
          });
        });
        break;
      }
    }
  } catch (error) {
    logFailure(`create:${kindValue}`, error, { userId: user.id, memberId: member.id });
    return failure(
      kindValue === "skills"
        ? "That skill may already be on your profile."
        : "The entry could not be added. Check for duplicate values and try again.",
    );
  }

  revalidatePortfolio(member.slug, kindValue);
  return { status: "success", message: "Portfolio entry added." };
}

export async function updatePortfolioEntry(
  kindValue: PortfolioKind,
  recordId: string,
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  void _previousState;
  if (!isPortfolioKind(kindValue)) return failure("That portfolio section is unavailable.");
  if (!recordId || recordId.length > 64) return failure("That entry is no longer available.");

  const { user, member } = await requireCurrentMember();
  const raw = readPortfolioForm(kindValue, formData);
  let replacedMediaUrl: string | null = null;
  let nextMediaUrl: string | null = null;

  try {
    const found = await prisma.$transaction(async (transaction) => {
      let count = 0;
      switch (kindValue) {
        case "skills": {
          const parsed = skillUpdateSchema.safeParse(raw);
          if (!parsed.success) return { validation: parsed.error.flatten().fieldErrors };
          const result = await transaction.memberSkill.updateMany({
            where: { memberId: member.id, skillId: recordId },
            data: { proficiency: parsed.data.proficiency ?? null },
          });
          count = result.count;
          break;
        }
        case "certifications": {
          const parsed = certificationSchema.safeParse(raw);
          if (!parsed.success) return { validation: parsed.error.flatten().fieldErrors };
          const result = await transaction.certification.updateMany({
            where: { id: recordId, memberId: member.id },
            data: certificationData(parsed.data),
          });
          count = result.count;
          break;
        }
        case "achievements": {
          const parsed = memberAchievementSchema.safeParse(raw);
          if (!parsed.success) return { validation: parsed.error.flatten().fieldErrors };
          const result = await transaction.achievement.updateMany({
            where: { id: recordId, memberId: member.id },
            data: achievementData(parsed.data),
          });
          count = result.count;
          break;
        }
        case "projects": {
          const parsed = personalProjectSchema.safeParse(raw);
          if (!parsed.success) return { validation: parsed.error.flatten().fieldErrors };
          const existing = await transaction.personalProject.findFirst({
            where: { id: recordId, memberId: member.id },
            select: { thumbnailUrl: true },
          });
          if (!existing) return { found: false };
          replacedMediaUrl = existing.thumbnailUrl;
          nextMediaUrl = parsed.data.thumbnailUrl ?? null;
          const result = await transaction.personalProject.updateMany({
            where: { id: recordId, memberId: member.id },
            data: projectData(parsed.data),
          });
          count = result.count;
          break;
        }
        case "links": {
          const parsed = socialLinkSchema.safeParse(raw);
          if (!parsed.success) return { validation: parsed.error.flatten().fieldErrors };
          const result = await transaction.socialLink.updateMany({
            where: { id: recordId, memberId: member.id },
            data: parsed.data,
          });
          count = result.count;
          break;
        }
      }

      if (count !== 1) return { found: false };
      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: auditByKind[kindValue].updated,
          entityType: auditByKind[kindValue].entityType,
          entityId: recordId,
        },
      });
      return { found: true };
    });

    if ("validation" in found && found.validation) return invalid(found.validation);
    if (!found.found) return failure("That entry is no longer available.");
  } catch (error) {
    logFailure(`update:${kindValue}`, error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return failure("The entry could not be saved. Check for duplicate values and try again.");
  }

  revalidatePortfolio(member.slug, kindValue);
  if (replacedMediaUrl && replacedMediaUrl !== nextMediaUrl) {
    await deleteMediaIfUnreferenced(replacedMediaUrl);
  }
  return { status: "success", message: "Portfolio entry saved." };
}

export async function deletePortfolioEntry(
  kindValue: PortfolioKind,
  recordId: string,
  _previousState: PortfolioActionState,
  _formData: FormData,
): Promise<PortfolioActionState> {
  void _previousState;
  void _formData;
  if (!isPortfolioKind(kindValue)) return failure("That portfolio section is unavailable.");
  if (!recordId || recordId.length > 64) return failure("That entry is no longer available.");

  const { user, member } = await requireCurrentMember();
  let deletedMediaUrl: string | null = null;

  try {
    const found = await prisma.$transaction(async (transaction) => {
      let count = 0;
      switch (kindValue) {
        case "skills":
          count = (
            await transaction.memberSkill.deleteMany({
              where: { memberId: member.id, skillId: recordId },
            })
          ).count;
          break;
        case "certifications":
          count = (
            await transaction.certification.deleteMany({
              where: { id: recordId, memberId: member.id },
            })
          ).count;
          break;
        case "achievements":
          count = (
            await transaction.achievement.deleteMany({
              where: { id: recordId, memberId: member.id },
            })
          ).count;
          break;
        case "projects":
          {
            const project = await transaction.personalProject.findFirst({
              where: { id: recordId, memberId: member.id },
              select: { id: true, thumbnailUrl: true },
            });
            if (project) {
              await transaction.personalProject.delete({ where: { id: project.id } });
              deletedMediaUrl = project.thumbnailUrl;
              count = 1;
            }
          }
          break;
        case "links":
          count = (
            await transaction.socialLink.deleteMany({
              where: { id: recordId, memberId: member.id },
            })
          ).count;
          break;
      }

      if (count !== 1) return false;
      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: auditByKind[kindValue].deleted,
          entityType: auditByKind[kindValue].entityType,
          entityId: recordId,
        },
      });
      return true;
    });

    if (!found) return failure("That entry is no longer available.");
  } catch (error) {
    logFailure(`delete:${kindValue}`, error, {
      userId: user.id,
      memberId: member.id,
      recordId,
    });
    return failure("The entry could not be removed. Please try again.");
  }

  revalidatePortfolio(member.slug, kindValue);
  if (deletedMediaUrl) await deleteMediaIfUnreferenced(deletedMediaUrl);
  return { status: "success", message: "Portfolio entry removed." };
}
