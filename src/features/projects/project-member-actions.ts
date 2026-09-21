"use server";

import { revalidatePath } from "next/cache";

import {
  projectMemberRemoveSchema,
  projectMemberSchema,
  readProjectMemberForm,
  readProjectMemberRemoveForm,
} from "@/features/projects/project-member-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type ProjectMemberActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function validationFailure(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): ProjectMemberActionState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function revalidateAssignmentPages(projectId: string, slug: string) {
  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
}

function logAssignmentFailure(action: string, actorUserId: string, error: unknown) {
  console.error("Project member assignment failed", {
    action,
    actorUserId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
}

export async function saveProjectMember(
  _previousState: ProjectMemberActionState,
  formData: FormData,
): Promise<ProjectMemberActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = projectMemberSchema.safeParse(readProjectMemberForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let projectSlug: string;
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const [project, member, existing] = await Promise.all([
        transaction.project.findUnique({
          where: { id: parsed.data.projectId },
          select: { id: true, slug: true },
        }),
        transaction.member.findUnique({
          where: { id: parsed.data.memberId },
          select: { id: true },
        }),
        transaction.projectMember.findUnique({
          where: {
            projectId_memberId: {
              projectId: parsed.data.projectId,
              memberId: parsed.data.memberId,
            },
          },
          select: { projectId: true },
        }),
      ]);
      if (!project || !member) return null;

      await transaction.projectMember.upsert({
        where: {
          projectId_memberId: { projectId: project.id, memberId: member.id },
        },
        create: {
          projectId: project.id,
          memberId: member.id,
          role: parsed.data.role ?? null,
          contribution: parsed.data.contribution ?? null,
        },
        update: {
          role: parsed.data.role ?? null,
          contribution: parsed.data.contribution ?? null,
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: existing ? "PROJECT_MEMBER_UPDATED" : "PROJECT_MEMBER_ASSIGNED",
          entityType: "ProjectMember",
          entityId: `${project.id}:${member.id}`,
          metadata: { projectId: project.id, memberId: member.id },
        },
      });
      return project.slug;
    });
    if (!outcome) {
      return { status: "error", message: "The project or Member profile is no longer available." };
    }
    projectSlug = outcome;
  } catch (error) {
    logAssignmentFailure("saveProjectMember", administrator.id, error);
    return { status: "error", message: "The project assignment could not be saved. Please try again." };
  }

  revalidateAssignmentPages(parsed.data.projectId, projectSlug);
  return { status: "success", message: "Project member assignment saved." };
}

export async function removeProjectMember(
  _previousState: ProjectMemberActionState,
  formData: FormData,
): Promise<ProjectMemberActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = projectMemberRemoveSchema.safeParse(readProjectMemberRemoveForm(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let projectSlug: string;
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const assignment = await transaction.projectMember.findUnique({
        where: {
          projectId_memberId: {
            projectId: parsed.data.projectId,
            memberId: parsed.data.memberId,
          },
        },
        select: {
          projectId: true,
          memberId: true,
          project: { select: { slug: true } },
        },
      });
      if (!assignment) return null;

      await transaction.projectMember.delete({
        where: {
          projectId_memberId: {
            projectId: assignment.projectId,
            memberId: assignment.memberId,
          },
        },
      });
      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "PROJECT_MEMBER_REMOVED",
          entityType: "ProjectMember",
          entityId: `${assignment.projectId}:${assignment.memberId}`,
          metadata: {
            projectId: assignment.projectId,
            memberId: assignment.memberId,
          },
        },
      });
      return assignment.project.slug;
    });
    if (!outcome) {
      return { status: "error", message: "That project assignment is no longer available." };
    }
    projectSlug = outcome;
  } catch (error) {
    logAssignmentFailure("removeProjectMember", administrator.id, error);
    return { status: "error", message: "The project assignment could not be removed. Please try again." };
  }

  revalidateAssignmentPages(parsed.data.projectId, projectSlug);
  return { status: "success", message: "Member removed from the project." };
}
