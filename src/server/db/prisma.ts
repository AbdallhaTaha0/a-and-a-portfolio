import "server-only";

import { PrismaClient } from "@prisma/client";

import { parseDatabaseEnvironment } from "@/lib/env/database";

const databaseEnvironment = parseDatabaseEnvironment(process.env);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseEnvironment.DATABASE_URL,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
