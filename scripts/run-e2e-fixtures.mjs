import { createHmac, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { PrismaClient, UserRole } from "@prisma/client";
import { config as loadEnvironment } from "dotenv";

loadEnvironment({ quiet: true });

const root = process.cwd();
const expectedHost = process.env.E2E_EXPECTED_DATABASE_HOST;
const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL;
const baseUrl = "http://localhost:3100";

if (!expectedHost || !runtimeUrl || !migrationUrl) {
  throw new Error("Set E2E_EXPECTED_DATABASE_HOST and both test database URLs before using fixture tests.");
}

const direct = new URL(migrationUrl);
const pooled = new URL(runtimeUrl);
if (
  direct.hostname !== expectedHost ||
  ![expectedHost, expectedHost.replace(/^([^.]+)/, "$1-pooler")].includes(pooled.hostname) ||
  direct.pathname !== pooled.pathname ||
  direct.protocol !== "postgresql:" ||
  pooled.protocol !== "postgresql:"
) {
  throw new Error("The configured pooled and direct URLs do not match the explicitly approved test database host.");
}

const runId = randomBytes(5).toString("hex");
const invitedEmail = `invited-${runId}@example.invalid`;
const projectSlug = `e2e-project-${runId}`;
const skillName = `E2E Skill ${runId}`;
const technologyName = `E2E Technology ${runId}`;
const authDirectory = resolve(root, ".auth", `generated-${runId}`);
const prisma = new PrismaClient({ datasourceUrl: migrationUrl });
const createdUserIds = [];
const storageFiles = [];
let createdTeamId;
let server;

async function runNode(args, environment) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  });
  return new Promise((resolveExit, rejectExit) => {
    child.once("error", rejectExit);
    child.once("exit", (code) => resolveExit(code ?? 1));
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error("The local test server exited before it became ready.");
    try {
      const response = await fetch(`${baseUrl}/login`);
      if (response.ok) return;
    } catch {
      // The server has not opened the port yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("The local test server did not become ready within 30 seconds.");
}

async function createIdentity(role, withMember) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const label = role.replace("-", " ").toUpperCase();
  const memberData = withMember
    ? {
        create: {
          slug: `e2e-${role}-${runId}`,
          fullName: `E2E ${label}`,
          headline: "Disposable browser-test profile",
          bio: "This profile belongs to an isolated automated browser test.",
          isPublished: role === "member-b",
        },
      }
    : undefined;

  const user = await prisma.user.create({
    data: {
      email: `${role}-${runId}@example.invalid`,
      name: `E2E ${label}`,
      role: role.startsWith("admin") ? UserRole.TEAM_ADMIN : UserRole.MEMBER,
      member: memberData,
      sessions: { create: { sessionToken: token, expires } },
    },
    select: { id: true, member: { select: { id: true, slug: true } } },
  });
  createdUserIds.push(user.id);

  const path = resolve(authDirectory, `${role}.json`);
  await writeFile(
    path,
    JSON.stringify({
      cookies: [{
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        expires: Math.floor(expires.getTime() / 1000),
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      }],
      origins: [],
    }),
    { mode: 0o600 },
  );
  storageFiles.push(path);
  return user;
}

async function main() {
  const existing = await Promise.all([
    prisma.user.count(),
    prisma.member.count(),
    prisma.team.count(),
    prisma.project.count(),
    prisma.contactMessage.count(),
    prisma.auditLog.count(),
  ]);
  if (existing.some((count) => count !== 0)) {
    throw new Error("Fixture tests require an empty test branch; existing application data was found.");
  }

  try {
    await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(1000) });
    throw new Error("Port 3100 is already serving an application; stop it before fixture tests.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Port 3100")) throw error;
  }

  const environment = {
    ...process.env,
    AUTH_URL: baseUrl,
    AUTH_TRUST_HOST: "true",
    NEXT_PUBLIC_APP_URL: baseUrl,
  };
  if (await runNode(["./node_modules/next/dist/bin/next", "build"], environment)) {
    throw new Error("The production build failed; no fixtures were created.");
  }

  await mkdir(authDirectory, { recursive: true, mode: 0o700 });
  const team = await prisma.team.create({
    data: { name: "E2E Team", slug: "a-and-a" },
    select: { id: true },
  });
  createdTeamId = team.id;

  const memberA = await createIdentity("member-a", true);
  const memberB = await createIdentity("member-b", true);
  await createIdentity("admin-a", true);
  await createIdentity("admin-b", false);

  server = spawn(process.execPath, ["./node_modules/next/dist/bin/next", "start", "-p", "3100"], {
    cwd: root,
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  });
  await waitForServer();

  const testEnvironment = {
    ...environment,
    E2E_BASE_URL: baseUrl,
    E2E_ROLE_TESTS: "1",
    E2E_FIXTURE_MODE: "1",
    E2E_SESSION_DIR: authDirectory,
    E2E_OTHER_MEMBER_ID: memberB.member.id,
    E2E_MEMBER_A_SLUG: memberA.member.slug,
    E2E_MEMBER_B_SLUG: memberB.member.slug,
    E2E_ADMIN_A_EMAIL: `admin-a-${runId}@example.invalid`,
    E2E_ADMIN_B_EMAIL: `admin-b-${runId}@example.invalid`,
    E2E_INVITED_EMAIL: invitedEmail,
    E2E_INVITED_SLUG: `e2e-invited-${runId}`,
    E2E_PROJECT_SLUG: projectSlug,
    E2E_SKILL_NAME: skillName,
    E2E_TECHNOLOGY_NAME: technologyName,
  };
  return runNode(["./node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)], testEnvironment);
}

let result = 1;
try {
  result = await main();
} finally {
  if (server && server.exitCode === null) server.kill();
  for (const path of storageFiles) await unlink(path).catch(() => {});
  if (storageFiles.length) await rmdir(authDirectory).catch(() => {});
  await prisma.project.deleteMany({ where: { slug: projectSlug } });
  await prisma.technology.deleteMany({ where: { name: technologyName } });
  if (createdUserIds.length) {
    await prisma.auditLog.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { email: invitedEmail } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    if (process.env.AUTH_SECRET) {
      const keys = createdUserIds.slice(2).map(rateLimitKey);
      await prisma.rateLimitBucket.deleteMany({ where: { key: { in: keys } } });
    }
  }
  if (createdTeamId) await prisma.team.deleteMany({ where: { id: createdTeamId } });
  await prisma.skill.deleteMany({ where: { name: skillName } });
  await prisma.$disconnect();
}
process.exitCode = result;

function rateLimitKey(userId) {
  return `admin-high-impact:${createHmac("sha256", process.env.AUTH_SECRET)
    .update(userId.toLowerCase())
    .digest("hex")}`;
}
