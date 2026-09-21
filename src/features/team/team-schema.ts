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

export const teamContentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(160, "Use 160 characters or fewer."),
  shortDescription: optionalText(320),
  description: optionalText(4_000),
  contactEmail: z.preprocess(
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
  location: optionalText(160),
  githubUrl: optionalHttpsUrl,
  linkedinUrl: optionalHttpsUrl,
});

export type TeamContentInput = z.infer<typeof teamContentSchema>;

export function readTeamContentFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    contactEmail: formData.get("contactEmail"),
    location: formData.get("location"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
  };
}

export function toTeamContentUpdate(input: TeamContentInput) {
  return {
    name: input.name,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    contactEmail: input.contactEmail ?? null,
    location: input.location ?? null,
    githubUrl: input.githubUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
  };
}
