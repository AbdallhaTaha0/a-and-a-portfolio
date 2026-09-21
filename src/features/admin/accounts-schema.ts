import { z } from "zod";

const fullName = z.string().trim().min(2, "Enter at least 2 characters.").max(160);
const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(320);
const slug = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters.")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens.");

export const ownMemberProfileSchema = z.object({
  fullName,
  slug,
  headline: z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(240).optional(),
  ),
});

export const memberInvitationSchema = ownMemberProfileSchema.extend({ email });
export const administratorInvitationSchema = z.object({ email, name: fullName });

const userId = z.string().trim().min(1).max(64);

export const accountRoleChangeSchema = z.object({
  userId,
  role: z.enum(["TEAM_ADMIN", "MEMBER"]),
});

export const accountStatusChangeSchema = z.object({
  userId,
  isActive: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export function readOwnMemberProfileForm(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    slug: formData.get("slug"),
    headline: formData.get("headline"),
  };
}

export function readMemberInvitationForm(formData: FormData) {
  return {
    ...readOwnMemberProfileForm(formData),
    email: formData.get("email"),
  };
}

export function readAdministratorInvitationForm(formData: FormData) {
  return { email: formData.get("email"), name: formData.get("name") };
}

export function readAccountRoleChangeForm(formData: FormData) {
  return { userId: formData.get("userId"), role: formData.get("role") };
}

export function readAccountStatusChangeForm(formData: FormData) {
  return { userId: formData.get("userId"), isActive: formData.get("isActive") };
}

export function suggestSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
