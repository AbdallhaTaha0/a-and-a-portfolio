"use server";

import { Prisma, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  accountRoleChangeSchema,
  accountStatusChangeSchema,
  administratorInvitationSchema,
  memberInvitationSchema,
  ownMemberProfileSchema,
  readAccountRoleChangeForm,
  readAccountStatusChangeForm,
  readAdministratorInvitationForm,
  readMemberInvitationForm,
  readOwnMemberProfileForm,
} from "@/features/admin/accounts-schema";
import { canApplyAccountCapabilityChange } from "@/server/admin/account-policy";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type AccountActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function validationFailure(error: { flatten(): { fieldErrors: Record<string, string[]> } }): AccountActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function conflictFailure(error: unknown): AccountActionState | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      status: "error",
      message: "That email address or public slug is already in use.",
    };
  }
  return null;
}

function logAccountFailure(action: string, actorUserId: string, error: unknown) {
  console.error("Team account operation failed", {
    action,
    actorUserId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

function revalidateAccounts() {
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/members");
}

export async function createOwnMemberProfile(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const administrator = await requireTeamAdmin();
  if (administrator.member) {
    return { status: "error", message: "This account already has a Member profile." };
  }

  const parsed = ownMemberProfileSchema.safeParse(readOwnMemberProfileForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.$transaction(async (transaction) => {
      const ordering = await transaction.member.aggregate({ _max: { teamOrder: true } });
      const profile = await transaction.member.create({
        data: {
          userId: administrator.id,
          fullName: parsed.data.fullName,
          slug: parsed.data.slug,
          headline: parsed.data.headline ?? null,
          teamOrder: (ordering._max.teamOrder ?? -1) + 1,
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "ADMIN_OWN_MEMBER_PROFILE_CREATED",
          entityType: "Member",
          entityId: profile.id,
        },
      });
    });
  } catch (error) {
    const conflict = conflictFailure(error);
    if (conflict) return conflict;
    logAccountFailure("createOwnMemberProfile", administrator.id, error);
    return { status: "error", message: "Your Member profile could not be created. Please try again." };
  }

  revalidateAccounts();
  revalidatePath("/admin/profile");
  return { status: "success", message: "Your Member profile is ready." };
}

export async function inviteMemberAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = memberInvitationSchema.safeParse(readMemberInvitationForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.$transaction(async (transaction) => {
      const ordering = await transaction.member.aggregate({ _max: { teamOrder: true } });
      const invitedUser = await transaction.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.fullName,
          role: UserRole.MEMBER,
          member: {
            create: {
              fullName: parsed.data.fullName,
              slug: parsed.data.slug,
              headline: parsed.data.headline ?? null,
              teamOrder: (ordering._max.teamOrder ?? -1) + 1,
            },
          },
        },
        select: { id: true, member: { select: { id: true } } },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "MEMBER_ACCOUNT_INVITED",
          entityType: "User",
          entityId: invitedUser.id,
        },
      });
    });
  } catch (error) {
    const conflict = conflictFailure(error);
    if (conflict) return conflict;
    logAccountFailure("inviteMemberAccount", administrator.id, error);
    return { status: "error", message: "The member account could not be created. Please try again." };
  }

  revalidateAccounts();
  return {
    status: "success",
    message: "Member account created. They can now sign in with that email address.",
  };
}

export async function inviteAdministratorAccount(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = administratorInvitationSchema.safeParse(
    readAdministratorInvitationForm(formData),
  );
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await prisma.$transaction(async (transaction) => {
      const invitedUser = await transaction.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          role: UserRole.TEAM_ADMIN,
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "TEAM_ADMIN_INVITED",
          entityType: "User",
          entityId: invitedUser.id,
        },
      });
    });
  } catch (error) {
    const conflict = conflictFailure(error);
    if (conflict) return conflict;
    logAccountFailure("inviteAdministratorAccount", administrator.id, error);
    return { status: "error", message: "The administrator account could not be created. Please try again." };
  }

  revalidateAccounts();
  return {
    status: "success",
    message: "Administrator account created. They can now sign in with that email address.",
  };
}

export async function changeAccountRole(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = accountRoleChangeSchema.safeParse(readAccountRoleChangeForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const outcome = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: parsed.data.userId },
          select: {
            role: true,
            isActive: true,
            member: { select: { id: true } },
          },
        });
        if (!target) return "NOT_FOUND" as const;
        if (target.role === parsed.data.role) return "UNCHANGED" as const;
        if (parsed.data.role === UserRole.MEMBER && !target.member) {
          return "PROFILE_REQUIRED" as const;
        }

        const activeAdministratorCount = await transaction.user.count({
          where: { role: UserRole.TEAM_ADMIN, isActive: true },
        });
        if (
          !canApplyAccountCapabilityChange(
            target,
            { role: parsed.data.role, isActive: target.isActive },
            activeAdministratorCount,
          )
        ) {
          return "FINAL_ADMIN" as const;
        }

        await transaction.user.update({
          where: { id: parsed.data.userId },
          data: { role: parsed.data.role },
        });
        await transaction.session.deleteMany({
          where: { userId: parsed.data.userId },
        });
        await transaction.auditLog.create({
          data: {
            userId: administrator.id,
            action:
              parsed.data.role === UserRole.TEAM_ADMIN
                ? "USER_PROMOTED_TO_TEAM_ADMIN"
                : "TEAM_ADMIN_DEMOTED_TO_MEMBER",
            entityType: "User",
            entityId: parsed.data.userId,
            metadata: { previousRole: target.role, nextRole: parsed.data.role },
          },
        });
        return "UPDATED" as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (outcome === "NOT_FOUND") {
      return { status: "error", message: "That account is no longer available." };
    }
    if (outcome === "PROFILE_REQUIRED") {
      return {
        status: "error",
        message: "Create a Member profile for this administrator before demoting them.",
      };
    }
    if (outcome === "FINAL_ADMIN") {
      return {
        status: "error",
        message: "The final active administrator cannot be demoted.",
      };
    }
    if (outcome === "UNCHANGED") {
      return { status: "success", message: "The account already has that role." };
    }
  } catch (error) {
    logAccountFailure("changeAccountRole", administrator.id, error);
    return {
      status: "error",
      message:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
          ? "The account changed at the same time. Please try again."
          : "The account role could not be changed. Please try again.",
    };
  }

  revalidateAccounts();
  return { status: "success", message: "Account role updated and active sessions revoked." };
}

export async function changeAccountStatus(
  _previousState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = accountStatusChangeSchema.safeParse(readAccountStatusChangeForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const outcome = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.user.findUnique({
          where: { id: parsed.data.userId },
          select: {
            role: true,
            isActive: true,
            member: { select: { id: true } },
          },
        });
        if (!target) return "NOT_FOUND" as const;
        if (target.isActive === parsed.data.isActive) return "UNCHANGED" as const;
        if (parsed.data.isActive && target.role === UserRole.MEMBER && !target.member) {
          return "PROFILE_REQUIRED" as const;
        }

        const activeAdministratorCount = await transaction.user.count({
          where: { role: UserRole.TEAM_ADMIN, isActive: true },
        });
        if (
          !canApplyAccountCapabilityChange(
            target,
            { role: target.role, isActive: parsed.data.isActive },
            activeAdministratorCount,
          )
        ) {
          return "FINAL_ADMIN" as const;
        }

        await transaction.user.update({
          where: { id: parsed.data.userId },
          data: { isActive: parsed.data.isActive },
        });
        await transaction.session.deleteMany({
          where: { userId: parsed.data.userId },
        });
        await transaction.auditLog.create({
          data: {
            userId: administrator.id,
            action: parsed.data.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            entityType: "User",
            entityId: parsed.data.userId,
          },
        });
        return "UPDATED" as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (outcome === "NOT_FOUND") {
      return { status: "error", message: "That account is no longer available." };
    }
    if (outcome === "PROFILE_REQUIRED") {
      return {
        status: "error",
        message: "Link a Member profile before activating this MEMBER account.",
      };
    }
    if (outcome === "FINAL_ADMIN") {
      return {
        status: "error",
        message: "The final active administrator cannot be deactivated.",
      };
    }
    if (outcome === "UNCHANGED") {
      return { status: "success", message: "The account already has that status." };
    }
  } catch (error) {
    logAccountFailure("changeAccountStatus", administrator.id, error);
    return {
      status: "error",
      message:
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034"
          ? "The account changed at the same time. Please try again."
          : "The account status could not be changed. Please try again.",
    };
  }

  revalidateAccounts();
  return {
    status: "success",
    message: parsed.data.isActive
      ? "Account activated. Previous sessions remain revoked."
      : "Account deactivated and active sessions revoked.",
  };
}
