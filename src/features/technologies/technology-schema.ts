import { z } from "zod";

const id = z.string().trim().min(1).max(64);
const optionalText = (maximum: number) => z.preprocess(
  (value) => value == null || (typeof value === "string" && value.trim() === "") ? undefined : value,
  z.string().trim().max(maximum).optional(),
);
const optionalHttpsUrl = z.preprocess(
  (value) => value == null || (typeof value === "string" && value.trim() === "") ? undefined : value,
  z.string().trim().url("Enter a complete URL.").refine((value) => {
    try { return new URL(value).protocol === "https:"; } catch { return true; }
  }, "Use a secure HTTPS URL.").optional(),
);

export const technologyFields = {
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  category: optionalText(120),
  iconUrl: optionalHttpsUrl,
} satisfies z.ZodRawShape;

export const technologyCreateSchema = z.object(technologyFields);
export const technologyUpdateSchema = z.object({ technologyId: id, ...technologyFields });
export const technologyDeleteSchema = z.object({
  technologyId: id,
  confirmation: z.string().trim().min(1, "Type the technology name to confirm deletion.").max(120),
});
export const projectTechnologySchema = z.object({ projectId: id, technologyId: id });

export function readTechnologyForm(formData: FormData) {
  return { name: formData.get("name"), category: formData.get("category"), iconUrl: formData.get("iconUrl") };
}
export function readTechnologyUpdateForm(formData: FormData) {
  return { technologyId: formData.get("technologyId"), ...readTechnologyForm(formData) };
}
export function readTechnologyDeleteForm(formData: FormData) {
  return { technologyId: formData.get("technologyId"), confirmation: formData.get("confirmation") };
}
export function readProjectTechnologyForm(formData: FormData) {
  return { projectId: formData.get("projectId"), technologyId: formData.get("technologyId") };
}
