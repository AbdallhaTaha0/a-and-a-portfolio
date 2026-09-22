"use server";

import { revalidatePath } from "next/cache";

import { contactMessageSchema } from "@/features/contact/contact-schema";
import { prisma } from "@/server/db/prisma";
import { consumeRequestRateLimit } from "@/server/security/rate-limit";

export type ContactActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

const SUCCESS_MESSAGE = "Thanks—your message has been sent to the team.";

export async function submitContactMessage(
  _previousState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  void _previousState;

  const website = formData.get("website");
  if (typeof website === "string" && website.length > 0) {
    return { status: "success", message: SUCCESS_MESSAGE };
  }

  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    website: typeof website === "string" ? website : "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const rateLimit = await consumeRequestRateLimit({
      scope: "contact-message",
      limit: 5,
      windowMs: 60 * 60 * 1_000,
    });

    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many messages were sent recently. Please try again later.",
      };
    }
  } catch (error) {
    console.error("Contact rate limiter failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      message: "Message protection is temporarily unavailable. Please try again.",
    };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Contact message creation failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      status: "error",
      message: "Your message could not be sent. Please try again.",
    };
  }

  revalidatePath("/admin/messages");
  return { status: "success", message: SUCCESS_MESSAGE };
}
