import type { ProjectStatus } from "@prisma/client";

const monthYear = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const statusLabels: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export function projectStatusLabel(status: ProjectStatus) {
  return statusLabels[status];
}

export function projectDateRange(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) return null;
  if (!startDate && endDate) return `Completed ${monthYear.format(endDate)}`;
  if (startDate && !endDate) return `Started ${monthYear.format(startDate)}`;
  return `${monthYear.format(startDate!)} — ${monthYear.format(endDate!)}`;
}
