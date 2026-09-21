export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isBootstrapAdminEmail(
  candidateEmail: string,
  configuredAdminEmail: string | undefined,
) {
  if (!configuredAdminEmail?.trim()) {
    return false;
  }

  return normalizeEmail(candidateEmail) === normalizeEmail(configuredAdminEmail);
}

export function canUseProtectedArea(account: { isActive: boolean } | null) {
  return account?.isActive === true;
}

export type DashboardRole = "TEAM_ADMIN" | "MEMBER";

type DashboardIdentity = {
  isActive: boolean;
  role: DashboardRole;
  memberId: string | null;
};

export function resolveLoginDestination(identity: DashboardIdentity | null) {
  if (!identity?.isActive) {
    return null;
  }

  return resolveDashboardAccess(identity).destination;
}

export type DashboardAccess = {
  canManageTeam: boolean;
  canManageOwnProfile: boolean;
  destination:
    | "/admin"
    | "/admin/profile"
    | "/admin/profile/setup-required"
    | "/login?error=AccountInactive";
};

export function resolveDashboardAccess(identity: DashboardIdentity): DashboardAccess {
  if (!identity.isActive) {
    return {
      canManageTeam: false,
      canManageOwnProfile: false,
      destination: "/login?error=AccountInactive",
    };
  }

  const hasMemberProfile = identity.memberId !== null;

  if (identity.role === "TEAM_ADMIN") {
    return {
      canManageTeam: true,
      canManageOwnProfile: hasMemberProfile,
      destination: "/admin",
    };
  }

  return {
    canManageTeam: false,
    canManageOwnProfile: hasMemberProfile,
    destination: hasMemberProfile
      ? "/admin/profile"
      : "/admin/profile/setup-required",
  };
}
