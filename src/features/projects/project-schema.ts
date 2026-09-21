import { ProjectStatus } from "@prisma/client";
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

const optionalDate = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
    .refine(
      (value) => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
      },
      { message: "Enter a valid date." },
    )
    .optional(),
);

const sortOrder = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") return value;
    return Number(value);
  },
  z.number().int("Use a whole number.").min(0, "Order cannot be negative.").max(1_000_000),
);

export const projectInputShape = {
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(200),
  slug: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens only."),
  shortDescription: optionalText(320),
  description: optionalText(10_000),
  thumbnailUrl: optionalHttpsUrl,
  githubUrl: optionalHttpsUrl,
  liveUrl: optionalHttpsUrl,
  status: z.enum(ProjectStatus),
  startDate: optionalDate,
  endDate: optionalDate,
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder,
} satisfies z.ZodRawShape;

function validateProject(
  project: z.infer<z.ZodObject<typeof projectInputShape>>,
  context: z.RefinementCtx,
) {
  if (project.startDate && project.endDate && project.endDate < project.startDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be on or after the start date.",
    });
  }
  if (!project.isPublished) return;
  for (const [field, message] of [
    ["shortDescription", "Add a short description before publishing."],
    ["description", "Add a full description before publishing."],
    ["thumbnailUrl", "Add a thumbnail URL before publishing."],
  ] as const) {
    if (!project[field]) {
      context.addIssue({ code: "custom", path: [field], message });
    }
  }
}

export const projectCreateSchema = z.object(projectInputShape).superRefine(validateProject);
export const projectUpdateSchema = z
  .object({ projectId: z.string().trim().min(1).max(64), ...projectInputShape })
  .superRefine(validateProject);
export const projectDeleteSchema = z.object({
  projectId: z.string().trim().min(1).max(64),
  confirmation: z.string().trim().min(1, "Type the project slug to confirm deletion.").max(120),
});

export type ProjectInput = z.infer<typeof projectCreateSchema>;

function readProjectFields(formData: FormData) {
  return {
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    thumbnailUrl: formData.get("thumbnailUrl"),
    githubUrl: formData.get("githubUrl"),
    liveUrl: formData.get("liveUrl"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isFeatured: formData.get("isFeatured") === "on",
    isPublished: formData.get("isPublished") === "on",
    sortOrder: formData.get("sortOrder"),
  };
}

export function readProjectCreateForm(formData: FormData) {
  return readProjectFields(formData);
}

export function readProjectUpdateForm(formData: FormData) {
  return { projectId: formData.get("projectId"), ...readProjectFields(formData) };
}

export function readProjectDeleteForm(formData: FormData) {
  return {
    projectId: formData.get("projectId"),
    confirmation: formData.get("confirmation"),
  };
}

export function toProjectData(input: ProjectInput) {
  return {
    title: input.title,
    slug: input.slug,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    githubUrl: input.githubUrl ?? null,
    liveUrl: input.liveUrl ?? null,
    status: input.status,
    startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : null,
    endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : null,
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder,
  };
}
