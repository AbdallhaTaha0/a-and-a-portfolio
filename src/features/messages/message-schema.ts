import { ContactMessageStatus } from "@prisma/client";
import { z } from "zod";

export const messageStatusSchema = z.object({
  messageId: z.string().trim().min(1).max(64),
  status: z.enum(ContactMessageStatus),
});

export function readMessageStatusForm(formData: FormData) {
  return { messageId: formData.get("messageId"), status: formData.get("status") };
}
