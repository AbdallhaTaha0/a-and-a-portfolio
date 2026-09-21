import { describe, expect, it } from "vitest";

import { parseDatabaseEnvironment } from "./database";

const pooledUrl =
  "postgresql://user:password@example-pooler.neon.tech/neondb?sslmode=require";
const directUrl =
  "postgresql://user:password@example.neon.tech/neondb?sslmode=require";

describe("parseDatabaseEnvironment", () => {
  it("accepts pooled and direct PostgreSQL URLs", () => {
    expect(
      parseDatabaseEnvironment({
        DATABASE_URL: pooledUrl,
        DIRECT_URL: directUrl,
      }),
    ).toEqual({
      DATABASE_URL: pooledUrl,
      DIRECT_URL: directUrl,
    });
  });

  it("rejects shell commands wrapped around a connection URL", () => {
    expect(() =>
      parseDatabaseEnvironment({
        DATABASE_URL: `psql '${pooledUrl}'`,
        DIRECT_URL: directUrl,
      }),
    ).toThrow(/PostgreSQL connection string/);
  });
});
