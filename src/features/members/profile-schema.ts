import { z } from "zod";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(maximum).optional(),
  );

const optionalHttpsUrl = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z
    .string()
    .trim()
    .url("Enter a complete URL.")
    .refine(
      (value) => {
        try {
          return new URL(value).protocol === "https:";
        } catch {
          return true;
        }
      },
      { message: "Use a secure HTTPS URL." },
    )
    .optional(),
);

export const memberProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(160, "Use 160 characters or fewer."),
    headline: optionalText(240),
    bio: optionalText(4_000),
    location: optionalText(160),
    publicEmail: z.preprocess(
      (value) =>
        value == null || (typeof value === "string" && value.trim() === "")
          ? undefined
          : value,
      z
        .string()
        .trim()
        .email("Enter a valid email address.")
        .max(320)
        .optional(),
    ),
    phone: optionalText(40),
    profileImageUrl: optionalHttpsUrl,
    isPublished: z.boolean(),
  })
  .superRefine((profile, context) => {
    if (!profile.isPublished) {
      return;
    }

    if (!profile.headline) {
      context.addIssue({
        code: "custom",
        message: "Add a headline before publishing.",
        path: ["headline"],
      });
    }

    if (!profile.bio) {
      context.addIssue({
        code: "custom",
        message: "Add a biography before publishing.",
        path: ["bio"],
      });
    }
  });

export type MemberProfileInput = z.infer<typeof memberProfileSchema>;

export function readMemberProfileFormData(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    publicEmail: formData.get("publicEmail"),
    phone: formData.get("phone"),
    profileImageUrl: formData.get("profileImageUrl"),
    isPublished: formData.get("isPublished") === "on",
  };
}

export function toMemberProfileUpdate(input: MemberProfileInput) {
  return {
    fullName: input.fullName,
    headline: input.headline ?? null,
    bio: input.bio ?? null,
    location: input.location ?? null,
    publicEmail: input.publicEmail ?? null,
    phone: input.phone ?? null,
    profileImageUrl: input.profileImageUrl ?? null,
    isPublished: input.isPublished,
  };
}
