import { expect, test } from "@playwright/test";

test("a visitor can browse the landing page, members, and projects", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Members" }).click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Meet the A&A team");

  const memberCards = page.getByRole("region", { name: "Published members" }).getByRole("link");
  if (await memberCards.count()) {
    await memberCards.first().click();
    await expect(page).toHaveURL(/\/members\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Projects");
  const projectCards = page.getByRole("region", { name: "Published projects" }).getByRole("link");
  if (await projectCards.count()) {
    await projectCards.first().click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("the visitor login page offers providers but no registration", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in to A&A" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with Google/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continue with GitHub/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /register|sign up/i })).toHaveCount(0);
});

test("anonymous visitors cannot view dashboard content", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Sign in to A&A" })).toBeVisible();
  await expect(page.getByText("Team content", { exact: true })).toHaveCount(0);
});

test("missing public profiles and projects render non-indexable unavailable pages", async ({ page }) => {
  for (const [path, heading] of [
    ["/members/e2e-missing-profile-6b9f", "That member page isn't public."],
    ["/projects/e2e-missing-project-6b9f", "This project is not published."],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
  }
});

test("mobile public pages do not scroll horizontally", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/members", "/projects", "/login"]) {
    await page.goto(path);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(hasOverflow, `${path} should fit a 390px viewport`).toBe(false);
  }
});
