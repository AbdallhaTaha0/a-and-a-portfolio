import { z } from "zod";

import {
  memberProfileInputShape,
  validateMemberPublication,
} from "@/features/members/profile-schema";

const memberIdSchema = z.string().trim().min(1).max(64);

const teamOrderSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") return value;
    return Number(value);
  },
  z
    .number({ error: "Enter a team position." })
    .int("Use a whole number for the team position.")
    .min(0, "Team position cannot be negative.")
    .max(1_000_000, "Team position is too large."),
);

export const adminMemberUpdateSchema = z
  .object({
    memberId: memberIdSchema,
    slug: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters.")
      .max(120, "Use 120 characters or fewer.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens only.",
      ),
    teamOrder: teamOrderSchema,
    ...memberProfileInputShape,
  })
  .superRefine(validateMemberPublication);

export const adminMemberDeleteSchema = z.object({
  memberId: memberIdSchema,
  confirmation: z
    .string()
    .trim()
    .min(1, "Type the public slug to confirm deletion.")
    .max(120),
});

export type AdminMemberUpdateInput = z.infer<typeof adminMemberUpdateSchema>;

export function readAdminMemberUpdateForm(formData: FormData) {
  return {
    memberId: formData.get("memberId"),
    slug: formData.get("slug"),
    teamOrder: formData.get("teamOrder"),
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

export function readAdminMemberDeleteForm(formData: FormData) {
  return {
    memberId: formData.get("memberId"),
    confirmation: formData.get("confirmation"),
  };
}

export function toAdminMemberUpdate(input: AdminMemberUpdateInput) {
  return {
    slug: input.slug,
    teamOrder: input.teamOrder,
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
