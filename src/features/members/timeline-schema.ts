import { z } from "zod";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(maximum).optional(),
  );

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
  }, "Enter a valid date.");

const optionalDateString = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  dateString.optional(),
);

const timelineFields = {
  description: optionalText(4_000),
  startDate: dateString,
  endDate: optionalDateString,
  isCurrent: z.boolean(),
};

function validateTimelineDates(
  value: { startDate: string; endDate?: string; isCurrent: boolean },
  context: z.RefinementCtx,
) {
  if (!value.isCurrent && value.endDate && value.endDate < value.startDate) {
    context.addIssue({
      code: "custom",
      message: "End date cannot be before the start date.",
      path: ["endDate"],
    });
  }
}

export const educationSchema = z
  .object({
    institution: z.string().trim().min(2, "Enter the institution name.").max(200),
    degree: z.string().trim().min(2, "Enter the degree.").max(160),
    fieldOfStudy: z.string().trim().min(2, "Enter the field of study.").max(160),
    ...timelineFields,
  })
  .superRefine(validateTimelineDates);

export const experienceSchema = z
  .object({
    company: z.string().trim().min(2, "Enter the company name.").max(200),
    position: z.string().trim().min(2, "Enter the position.").max(160),
    ...timelineFields,
  })
  .superRefine(validateTimelineDates);

export type EducationInput = z.infer<typeof educationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;

export function readEducationFormData(formData: FormData) {
  return {
    institution: formData.get("institution"),
    degree: formData.get("degree"),
    fieldOfStudy: formData.get("fieldOfStudy"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent") === "on",
  };
}

export function readExperienceFormData(formData: FormData) {
  return {
    company: formData.get("company"),
    position: formData.get("position"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCurrent: formData.get("isCurrent") === "on",
  };
}

function timelineData(input: {
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
}) {
  return {
    description: input.description ?? null,
    startDate: new Date(`${input.startDate}T00:00:00.000Z`),
    endDate:
      input.isCurrent || !input.endDate
        ? null
        : new Date(`${input.endDate}T00:00:00.000Z`),
    isCurrent: input.isCurrent,
  };
}

export function toEducationData(input: EducationInput) {
  return {
    institution: input.institution,
    degree: input.degree,
    fieldOfStudy: input.fieldOfStudy,
    ...timelineData(input),
  };
}

export function toExperienceData(input: ExperienceInput) {
  return {
    company: input.company,
    position: input.position,
    ...timelineData(input),
  };
}
