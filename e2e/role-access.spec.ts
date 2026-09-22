import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

const roleTestsEnabled = process.env.E2E_ROLE_TESTS === "1";

function sessionFile(role: "member-a" | "member-b" | "admin-a" | "admin-b") {
  return resolve(process.env.E2E_SESSION_DIR ?? ".auth", `${role}.json`);
}

function requireSession(role: "member-a" | "member-b" | "admin-a" | "admin-b") {
  test.skip(
    !roleTestsEnabled || !existsSync(sessionFile(role)),
    `Set E2E_ROLE_TESTS=1 and capture a disposable ${role} session in .auth/${role}.json.`,
  );
}

for (const role of ["member-a", "member-b"] as const) {
  test.describe(`${role} access`, () => {
    requireSession(role);
    test.use({ storageState: sessionFile(role) });

    test("can open their personal workspace and preview", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/admin\/profile$/);
      await expect(page.getByRole("heading", { name: "Edit your profile" })).toBeVisible();

      await page.goto("/admin/profile/preview");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("keeps the authentication session in an HTTP-only cookie", async ({ page }) => {
      await page.goto("/admin/profile");
      const sessionCookies = (await page.context().cookies()).filter((cookie) =>
        cookie.name.includes("session-token"),
      );
      expect(sessionCookies.length).toBeGreaterThan(0);
      expect(sessionCookies.every((cookie) => cookie.httpOnly)).toBe(true);

      const browserStorageKeys = await page.evaluate(() => [
        ...Object.keys(localStorage),
        ...Object.keys(sessionStorage),
      ]);
      expect(browserStorageKeys.some((key) => /session|token|auth/i.test(key))).toBe(false);
    });

    test("cannot open team administration", async ({ page }) => {
      await page.goto("/admin/team");
      await expect(page).toHaveURL(/\/admin\/profile(?:\/|$)/);
      await expect(page.getByRole("heading", { name: "Team content" })).toHaveCount(0);
    });

    test("cannot open another member's administrative editor", async ({ page }) => {
      test.skip(!process.env.E2E_OTHER_MEMBER_ID, "Set E2E_OTHER_MEMBER_ID to a disposable second Member record ID.");
      await page.goto(`/admin/members/${encodeURIComponent(process.env.E2E_OTHER_MEMBER_ID!)}`);
      await expect(page).toHaveURL(/\/admin\/profile(?:\/|$)/);
    });
  });
}

for (const role of ["admin-a", "admin-b"] as const) {
  test.describe(`${role} access`, () => {
    requireSession(role);
    test.use({ storageState: sessionFile(role) });

    test("can independently open team and account administration", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/admin$/);
      await expect(page.getByRole("heading", { name: /Welcome,/ })).toBeVisible();

      await page.goto("/admin/team");
      await expect(page.getByRole("heading", { name: "Team content" })).toBeVisible();

      await page.goto("/admin/members");
      await expect(page.getByRole("heading", { name: "Accounts and profiles" })).toBeVisible();
    });
  });
}
