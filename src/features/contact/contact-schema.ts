import { z } from "zod";

export const contactMessageSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(160),
    email: z.string().trim().email("Enter a valid email address.").max(320),
    subject: z.string().trim().min(3, "Add a short subject.").max(240),
    message: z
      .string()
      .trim()
      .min(20, "Tell us a little more (at least 20 characters).")
      .max(5_000, "Keep the message under 5,000 characters."),
    website: z.string().max(0).optional(),
  })
  .strict();

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
