import { z } from "zod";

const postgresUrl = z
  .string()
  .trim()
  .regex(
    /^postgres(?:ql)?:\/\//,
    "Expected a PostgreSQL connection string beginning with postgresql://",
  );

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl,
});

export type DatabaseEnvironment = z.infer<typeof databaseEnvironmentSchema>;

export function parseDatabaseEnvironment(
  environment: Record<string, string | undefined>,
): DatabaseEnvironment {
  return databaseEnvironmentSchema.parse(environment);
}
