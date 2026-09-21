import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";
import { canUseProtectedArea } from "@/server/auth/policy";

const loadCurrentUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      member: {
        select: {
          id: true,
          slug: true,
          fullName: true,
          headline: true,
          bio: true,
          profileImageUrl: true,
          location: true,
          phone: true,
          publicEmail: true,
          isPublished: true,
        },
      },
    },
  });
});

export async function getCurrentUser() {
  return loadCurrentUser();
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!canUseProtectedArea(user)) {
    redirect("/login?error=AccountInactive");
  }

  return user;
}

export async function requireTeamAdmin() {
  const user = await requireCurrentUser();

  if (user.role !== "TEAM_ADMIN") {
    redirect(user.member ? "/admin/profile" : "/admin/profile/setup-required");
  }

  return user;
}

export async function requireCurrentMember() {
  const user = await requireCurrentUser();

  if (!user.member) {
    redirect("/admin/profile/setup-required");
  }

  return { user, member: user.member };
}
