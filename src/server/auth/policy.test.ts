import { describe, expect, it } from "vitest";

import {
  canUseProtectedArea,
  isBootstrapAdminEmail,
  normalizeEmail,
  resolveDashboardAccess,
  resolveLoginDestination,
} from "./policy";

describe("authentication policy", () => {
  it("normalizes emails before matching the bootstrap administrator", () => {
    expect(normalizeEmail(" Admin@Example.COM ")).toBe("admin@example.com");
    expect(
      isBootstrapAdminEmail("Admin@example.com", " admin@EXAMPLE.com "),
    ).toBe(true);
  });

  it("does not bootstrap an account without an explicit configured email", () => {
    expect(isBootstrapAdminEmail("admin@example.com", "")).toBe(false);
  });

  it("allows only active persisted accounts into protected areas", () => {
    expect(canUseProtectedArea({ isActive: true })).toBe(true);
    expect(canUseProtectedArea({ isActive: false })).toBe(false);
    expect(canUseProtectedArea(null)).toBe(false);
  });

  it("routes a member only to their linked personal workspace", () => {
    expect(
      resolveDashboardAccess({
        isActive: true,
        role: "MEMBER",
        memberId: "member-1",
      }),
    ).toEqual({
      canManageTeam: false,
      canManageOwnProfile: true,
      destination: "/admin/profile",
    });
  });

  it("sends a member without a profile to the safe setup state", () => {
    expect(
      resolveDashboardAccess({
        isActive: true,
        role: "MEMBER",
        memberId: null,
      }),
    ).toEqual({
      canManageTeam: false,
      canManageOwnProfile: false,
      destination: "/admin/profile/setup-required",
    });
  });

  it("gives a team administrator both capabilities only when a profile is linked", () => {
    expect(
      resolveDashboardAccess({
        isActive: true,
        role: "TEAM_ADMIN",
        memberId: "member-1",
      }),
    ).toEqual({
      canManageTeam: true,
      canManageOwnProfile: true,
      destination: "/admin",
    });

    expect(
      resolveDashboardAccess({
        isActive: true,
        role: "TEAM_ADMIN",
        memberId: null,
      }),
    ).toEqual({
      canManageTeam: true,
      canManageOwnProfile: false,
      destination: "/admin",
    });
  });

  it("denies all dashboard capabilities to inactive accounts", () => {
    expect(
      resolveDashboardAccess({
        isActive: false,
        role: "TEAM_ADMIN",
        memberId: "member-1",
      }),
    ).toEqual({
      canManageTeam: false,
      canManageOwnProfile: false,
      destination: "/login?error=AccountInactive",
    });
  });

  it("redirects signed-in visitors away from login to their authorized dashboard", () => {
    expect(
      resolveLoginDestination({
        isActive: true,
        role: "TEAM_ADMIN",
        memberId: "member-1",
      }),
    ).toBe("/admin");
    expect(
      resolveLoginDestination({
        isActive: true,
        role: "MEMBER",
        memberId: "member-1",
      }),
    ).toBe("/admin/profile");
    expect(
      resolveLoginDestination({
        isActive: false,
        role: "MEMBER",
        memberId: "member-1",
      }),
    ).toBeNull();
    expect(resolveLoginDestination(null)).toBeNull();
  });
});
