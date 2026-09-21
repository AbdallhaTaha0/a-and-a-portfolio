import { z } from "zod";

const id = z.string().trim().min(1).max(64);
const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(maximum).optional(),
  );

export const projectMemberSchema = z.object({
  projectId: id,
  memberId: id,
  role: optionalText(160),
  contribution: optionalText(4_000),
});

export const projectMemberRemoveSchema = z.object({
  projectId: id,
  memberId: id,
});

export function readProjectMemberForm(formData: FormData) {
  return {
    projectId: formData.get("projectId"),
    memberId: formData.get("memberId"),
    role: formData.get("role"),
    contribution: formData.get("contribution"),
  };
}

export function readProjectMemberRemoveForm(formData: FormData) {
  return {
    projectId: formData.get("projectId"),
    memberId: formData.get("memberId"),
  };
}
