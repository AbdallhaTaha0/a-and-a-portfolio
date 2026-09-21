export type AccountCapabilityState = {
  role: "TEAM_ADMIN" | "MEMBER";
  isActive: boolean;
};

export function removesActiveAdministratorCapability(
  current: AccountCapabilityState,
  next: AccountCapabilityState,
) {
  return (
    current.role === "TEAM_ADMIN" &&
    current.isActive &&
    (next.role !== "TEAM_ADMIN" || !next.isActive)
  );
}

export function canApplyAccountCapabilityChange(
  current: AccountCapabilityState,
  next: AccountCapabilityState,
  activeAdministratorCount: number,
) {
  return (
    !removesActiveAdministratorCapability(current, next) ||
    activeAdministratorCount > 1
  );
}
