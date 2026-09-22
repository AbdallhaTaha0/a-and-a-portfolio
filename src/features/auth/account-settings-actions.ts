"use server";

import { revalidatePath } from "next/cache";

import {
  accountSettingsSchema,
  readAccountSettingsForm,
} from "@/features/auth/account-settings-schema";
import { requireCurrentUser } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type AccountSettingsState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function updateOwnAccountSettings(
  _previousState: AccountSettingsState,
  formData: FormData,
): Promise<AccountSettingsState> {
  void _previousState;
  const user = await requireCurrentUser();
  const parsed = accountSettingsSchema.safeParse(readAccountSettingsForm(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = await prisma.$transaction(async (transaction) => {
      const result = await transaction.user.updateMany({
        where: { id: user.id, isActive: true },
        data: { name: parsed.data.name ?? null },
      });
      if (result.count !== 1) return false;

      await transaction.auditLog.create({
        data: {
          userId: user.id,
          action: "ACCOUNT_SETTINGS_UPDATED",
          entityType: "User",
          entityId: user.id,
        },
      });
      return true;
    });

    if (!updated) {
      return { status: "error", message: "Your active account could not be found." };
    }
  } catch (error) {
    console.error("Failed to update account settings", {
      userId: user.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { status: "error", message: "Account settings could not be saved. Please try again." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  return { status: "success", message: "Account settings saved." };
}
