"use server";
import { revalidatePath } from "next/cache";
import { messageStatusSchema, readMessageStatusForm } from "./message-schema";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export type MessageActionState = { status: "idle" | "success" | "error"; message: string; fieldErrors?: Record<string, string[]> };
export async function changeMessageStatus(_state: MessageActionState, formData: FormData): Promise<MessageActionState> {
  const admin = await requireTeamAdmin();
  const parsed = messageStatusSchema.safeParse(readMessageStatusForm(formData));
  if (!parsed.success) return { status: "error", message: "Choose a valid message status.", fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const target = await tx.contactMessage.findUnique({ where: { id: parsed.data.messageId }, select: { id: true, status: true } });
      if (!target) return "NOT_FOUND" as const;
      if (target.status === parsed.data.status) return "UNCHANGED" as const;
      await tx.contactMessage.update({ where: { id: target.id }, data: { status: parsed.data.status } });
      await tx.auditLog.create({ data: { userId: admin.id, action: "CONTACT_MESSAGE_STATUS_CHANGED", entityType: "ContactMessage", entityId: target.id, metadata: { previousStatus: target.status, nextStatus: parsed.data.status } } });
      return "UPDATED" as const;
    });
    if (outcome === "NOT_FOUND") return { status: "error", message: "That message is no longer available." };
    if (outcome === "UNCHANGED") return { status: "success", message: "The message already has that status." };
  } catch (error) {
    console.error("Contact message status change failed", { userId: admin.id, errorName: error instanceof Error ? error.name : "UnknownError" });
    return { status: "error", message: "The message status could not be changed. Please try again." };
  }
  revalidatePath("/admin"); revalidatePath("/admin/messages");
  return { status: "success", message: "Message status updated." };
}
