"use server";

import { revalidatePath } from "next/cache";

import {
  readTeamContentFormData,
  teamContentSchema,
  toTeamContentUpdate,
} from "@/features/team/team-schema";
import { PRIMARY_TEAM_SLUG } from "@/features/team/constants";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type TeamContentActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updateTeamContent(
  _previousState: TeamContentActionState,
  formData: FormData,
): Promise<TeamContentActionState> {
  const administrator = await requireTeamAdmin();
  const parsed = teamContentSchema.safeParse(readTeamContentFormData(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const team = await transaction.team.upsert({
        where: { slug: PRIMARY_TEAM_SLUG },
        update: toTeamContentUpdate(parsed.data),
        create: {
          slug: PRIMARY_TEAM_SLUG,
          ...toTeamContentUpdate(parsed.data),
        },
        select: { id: true },
      });

      await transaction.auditLog.create({
        data: {
          userId: administrator.id,
          action: "TEAM_CONTENT_UPDATED",
          entityType: "Team",
          entityId: team.id,
          metadata: {
            updatedFields: Object.keys(toTeamContentUpdate(parsed.data)),
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to update team content", {
      userId: administrator.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return {
      status: "error",
      message: "Team content could not be saved. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/team");

  return {
    status: "success",
    message: "Team content saved and published on the home page.",
  };
}
