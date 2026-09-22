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
    .refine((value) => new URL(value).protocol === "https:", "Use a secure HTTPS URL.")
    .optional(),
);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
  }, "Enter a valid date.");

const optionalDate = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  dateString.optional(),
);

const optionalProficiency = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : Number(value),
  z.number().int("Use a whole number.").min(1).max(100).optional(),
);

export const skillSchema = z.object({
  name: z.string().trim().min(2, "Enter the skill name.").max(120),
  category: optionalText(120),
  proficiency: optionalProficiency,
});

export const skillUpdateSchema = z.object({ proficiency: optionalProficiency });

export const certificationSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the certification name.").max(200),
    issuer: z.string().trim().min(2, "Enter the issuer.").max(200),
    description: optionalText(4_000),
    issueDate: dateString,
    expirationDate: optionalDate,
    credentialUrl: optionalHttpsUrl,
  })
  .refine(
    (value) => !value.expirationDate || value.expirationDate >= value.issueDate,
    { path: ["expirationDate"], message: "Expiration cannot be before the issue date." },
  );

export const memberAchievementSchema = z.object({
  title: z.string().trim().min(2, "Enter the achievement title.").max(200),
  description: z.string().trim().min(2, "Enter a description.").max(4_000),
  issuer: optionalText(200),
  date: optionalDate,
  url: optionalHttpsUrl,
});

export const personalProjectSchema = z
  .object({
    title: z.string().trim().min(2, "Enter the project title.").max(200),
    slug: z
      .string()
      .trim()
      .min(2, "Enter the project slug.")
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens only.",
      ),
    shortDescription: optionalText(320),
    description: optionalText(10_000),
    thumbnailUrl: optionalHttpsUrl,
    githubUrl: optionalHttpsUrl,
    liveUrl: optionalHttpsUrl,
    startDate: optionalDate,
    endDate: optionalDate,
    isFeatured: z.boolean(),
    isPublished: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before the start date.",
      });
    }
    if (value.isPublished && !value.shortDescription) {
      context.addIssue({
        code: "custom",
        path: ["shortDescription"],
        message: "Add a short description before publishing.",
      });
    }
    if (value.isPublished && !value.description) {
      context.addIssue({
        code: "custom",
        path: ["description"],
        message: "Add a full description before publishing.",
      });
    }
  });

export const socialLinkSchema = z.object({
  platform: z.string().trim().min(2, "Enter the platform name.").max(80),
  url: z.string().trim().url("Enter a complete URL.").refine(
    (value) => new URL(value).protocol === "https:",
    "Use a secure HTTPS URL.",
  ),
});

export type PortfolioKind =
  | "skills"
  | "certifications"
  | "achievements"
  | "projects"
  | "links";

export type PortfolioItem = {
  id: string;
  name?: string;
  category?: string | null;
  proficiency?: number | null;
  issuer?: string | null;
  description?: string | null;
  issueDate?: string;
  expirationDate?: string | null;
  credentialUrl?: string | null;
  title?: string;
  date?: string | null;
  url?: string | null;
  slug?: string;
  shortDescription?: string | null;
  thumbnailUrl?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
  platform?: string;
};

export const portfolioKinds = [
  "skills",
  "certifications",
  "achievements",
  "projects",
  "links",
] as const satisfies readonly PortfolioKind[];

export function readPortfolioForm(kind: PortfolioKind, formData: FormData) {
  switch (kind) {
    case "skills":
      return {
        name: formData.get("name"),
        category: formData.get("category"),
        proficiency: formData.get("proficiency"),
      };
    case "certifications":
      return {
        name: formData.get("name"),
        issuer: formData.get("issuer"),
        description: formData.get("description"),
        issueDate: formData.get("issueDate"),
        expirationDate: formData.get("expirationDate"),
        credentialUrl: formData.get("credentialUrl"),
      };
    case "achievements":
      return {
        title: formData.get("title"),
        description: formData.get("description"),
        issuer: formData.get("issuer"),
        date: formData.get("date"),
        url: formData.get("url"),
      };
    case "projects":
      return {
        title: formData.get("title"),
        slug: formData.get("slug"),
        shortDescription: formData.get("shortDescription"),
        description: formData.get("description"),
        thumbnailUrl: formData.get("thumbnailUrl"),
        githubUrl: formData.get("githubUrl"),
        liveUrl: formData.get("liveUrl"),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        isFeatured: formData.get("isFeatured") === "on",
        isPublished: formData.get("isPublished") === "on",
      };
    case "links":
      return { platform: formData.get("platform"), url: formData.get("url") };
  }
}

export function portfolioSchema(kind: PortfolioKind, updatingSkill = false) {
  switch (kind) {
    case "skills":
      return updatingSkill ? skillUpdateSchema : skillSchema;
    case "certifications":
      return certificationSchema;
    case "achievements":
      return memberAchievementSchema;
    case "projects":
      return personalProjectSchema;
    case "links":
      return socialLinkSchema;
  }
}

export function toNullableDate(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}
