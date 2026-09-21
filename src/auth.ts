import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { prisma } from "@/server/db/prisma";
import {
  canUseProtectedArea,
  isBootstrapAdminEmail,
  normalizeEmail,
} from "@/server/auth/policy";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 8 * 60 * 60,
    updateAge: 15 * 60,
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const email = normalizeEmail(user.email);
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true },
      });

      if (existingUser) {
        return canUseProtectedArea(existingUser);
      }

      if (!isBootstrapAdminEmail(email, process.env.AUTH_ADMIN_EMAIL)) {
        return false;
      }

      await prisma.user.create({
        data: {
          email,
          name: user.name,
          image: user.image,
          emailVerified: new Date(),
          role: UserRole.TEAM_ADMIN,
        },
      });

      return true;
    },
    async session({ session, user }) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, isActive: true },
      });

      if (session.user && currentUser) {
        session.user.id = currentUser.id;
        session.user.role = currentUser.role;
        session.user.isActive = currentUser.isActive;
      }

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) {
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    },
  },
});
