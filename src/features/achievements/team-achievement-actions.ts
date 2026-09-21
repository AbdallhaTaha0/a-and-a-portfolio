"use server";

import { revalidatePath } from "next/cache";
import { requireTeamAdmin } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { readTeamAchievementCreateForm, readTeamAchievementDeleteForm, readTeamAchievementUpdateForm, teamAchievementCreateSchema, teamAchievementDeleteSchema, teamAchievementUpdateSchema, toTeamAchievementData } from "./team-achievement-schema";

export type TeamAchievementActionState = { status: "idle" | "success" | "error"; message: string; fieldErrors?: Record<string, string[]> };
const validationFailure = (error: { flatten(): { fieldErrors: Record<string, string[]> } }): TeamAchievementActionState => ({ status: "error", message: "Please correct the highlighted fields.", fieldErrors: error.flatten().fieldErrors });
function revalidate() { revalidatePath("/"); revalidatePath("/admin"); revalidatePath("/admin/achievements"); }
function log(action: string, userId: string, error: unknown) { console.error("Team achievement operation failed", { action, userId, errorName: error instanceof Error ? error.name : "UnknownError" }); }

export async function createTeamAchievement(_state: TeamAchievementActionState, formData: FormData): Promise<TeamAchievementActionState> {
  const admin = await requireTeamAdmin(); const parsed = teamAchievementCreateSchema.safeParse(readTeamAchievementCreateForm(formData)); if (!parsed.success) return validationFailure(parsed.error);
  try { await prisma.$transaction(async (tx) => { const record = await tx.teamAchievement.create({ data: toTeamAchievementData(parsed.data), select: { id: true } }); await tx.auditLog.create({ data: { userId: admin.id, action: "TEAM_ACHIEVEMENT_CREATED", entityType: "TeamAchievement", entityId: record.id } }); }); }
  catch (error) { log("createTeamAchievement", admin.id, error); return { status: "error", message: "The achievement could not be created. Please try again." }; }
  revalidate(); return { status: "success", message: "Team achievement created." };
}
export async function updateTeamAchievement(_state: TeamAchievementActionState, formData: FormData): Promise<TeamAchievementActionState> {
  const admin = await requireTeamAdmin(); const parsed = teamAchievementUpdateSchema.safeParse(readTeamAchievementUpdateForm(formData)); if (!parsed.success) return validationFailure(parsed.error);
  try { const found = await prisma.$transaction(async (tx) => { const target = await tx.teamAchievement.findUnique({ where: { id: parsed.data.achievementId }, select: { id: true } }); if (!target) return false; await tx.teamAchievement.update({ where: { id: target.id }, data: toTeamAchievementData(parsed.data) }); await tx.auditLog.create({ data: { userId: admin.id, action: "TEAM_ACHIEVEMENT_UPDATED", entityType: "TeamAchievement", entityId: target.id } }); return true; }); if (!found) return { status: "error", message: "That achievement is no longer available." }; }
  catch (error) { log("updateTeamAchievement", admin.id, error); return { status: "error", message: "The achievement could not be saved. Please try again." }; }
  revalidate(); return { status: "success", message: "Team achievement saved." };
}
export async function deleteTeamAchievement(_state: TeamAchievementActionState, formData: FormData): Promise<TeamAchievementActionState> {
  const admin = await requireTeamAdmin(); const parsed = teamAchievementDeleteSchema.safeParse(readTeamAchievementDeleteForm(formData)); if (!parsed.success) return validationFailure(parsed.error);
  try { const outcome = await prisma.$transaction(async (tx) => { const target = await tx.teamAchievement.findUnique({ where: { id: parsed.data.achievementId }, select: { id: true, title: true } }); if (!target) return "NOT_FOUND" as const; if (target.title !== parsed.data.confirmation) return "MISMATCH" as const; await tx.teamAchievement.delete({ where: { id: target.id } }); await tx.auditLog.create({ data: { userId: admin.id, action: "TEAM_ACHIEVEMENT_DELETED", entityType: "TeamAchievement", entityId: target.id, metadata: { title: target.title } } }); return "DELETED" as const; }); if (outcome === "NOT_FOUND") return { status: "error", message: "That achievement is no longer available." }; if (outcome === "MISMATCH") return { status: "error", message: "The confirmation did not match the current title.", fieldErrors: { confirmation: ["Type the current title exactly."] } }; }
  catch (error) { log("deleteTeamAchievement", admin.id, error); return { status: "error", message: "The achievement could not be deleted. Please try again." }; }
  revalidate(); return { status: "success", message: "Team achievement deleted." };
}
