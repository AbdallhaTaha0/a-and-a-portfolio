import { z } from "zod";

const id = z.string().trim().min(1).max(64);
const optionalText = (max: number) => z.preprocess((value) => value == null || (typeof value === "string" && value.trim() === "") ? undefined : value, z.string().trim().max(max).optional());
const optionalHttpsUrl = z.preprocess((value) => value == null || (typeof value === "string" && value.trim() === "") ? undefined : value, z.string().trim().url("Enter a complete URL.").refine((value) => { try { return new URL(value).protocol === "https:"; } catch { return true; } }, "Use a secure HTTPS URL.").optional());
const optionalDate = z.preprocess((value) => value == null || (typeof value === "string" && value.trim() === "") ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").refine((value) => { const date = new Date(`${value}T00:00:00.000Z`); return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value; }, "Enter a valid date.").optional());
const sortOrder = z.preprocess((value) => typeof value === "string" && value.trim() !== "" ? Number(value) : value, z.number().int("Use a whole number.").min(0, "Order cannot be negative.").max(1_000_000));

export const teamAchievementFields = {
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(200),
  description: z.string().trim().min(2, "Enter a description.").max(4_000),
  issuer: optionalText(200), date: optionalDate, imageUrl: optionalHttpsUrl, url: optionalHttpsUrl, sortOrder,
} satisfies z.ZodRawShape;
export const teamAchievementCreateSchema = z.object(teamAchievementFields);
export const teamAchievementUpdateSchema = z.object({ achievementId: id, ...teamAchievementFields });
export const teamAchievementDeleteSchema = z.object({ achievementId: id, confirmation: z.string().trim().min(1).max(200) });
export type TeamAchievementInput = z.infer<typeof teamAchievementCreateSchema>;

function fields(formData: FormData) { return { title: formData.get("title"), description: formData.get("description"), issuer: formData.get("issuer"), date: formData.get("date"), imageUrl: formData.get("imageUrl"), url: formData.get("url"), sortOrder: formData.get("sortOrder") }; }
export const readTeamAchievementCreateForm = fields;
export function readTeamAchievementUpdateForm(formData: FormData) { return { achievementId: formData.get("achievementId"), ...fields(formData) }; }
export function readTeamAchievementDeleteForm(formData: FormData) { return { achievementId: formData.get("achievementId"), confirmation: formData.get("confirmation") }; }
export function toTeamAchievementData(input: TeamAchievementInput) { return { title: input.title, description: input.description, issuer: input.issuer ?? null, date: input.date ? new Date(`${input.date}T00:00:00.000Z`) : null, imageUrl: input.imageUrl ?? null, url: input.url ?? null, sortOrder: input.sortOrder }; }
