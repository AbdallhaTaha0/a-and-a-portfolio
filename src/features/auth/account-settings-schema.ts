import { z } from "zod";

export const accountSettingsSchema = z.object({
  name: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(2, "Use at least 2 characters.").max(160).optional(),
  ),
});

export function readAccountSettingsForm(formData: FormData) {
  return { name: formData.get("name") };
}
