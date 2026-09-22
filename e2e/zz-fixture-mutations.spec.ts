import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_FIXTURE_MODE !== "1", "Mutation tests run only through the isolated fixture runner.");

const sessionDirectory = process.env.E2E_SESSION_DIR ?? ".auth";

test.describe("disposable member mutations", () => {
  test.use({ storageState: resolve(sessionDirectory, "member-a.json") });

  test("rejects an incomplete publication, then publishes only the owner's profile", async ({ page }) => {
    await page.goto("/admin/profile");
    await page.getByLabel("Biography").fill("");
    await page.getByRole("checkbox", { name: "Publish profile" }).check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();

    await page.getByLabel("Professional headline").fill("E2E browser-test engineer");
    await page.getByLabel("Biography").fill("A disposable published profile used for browser verification.");
    await page.getByRole("checkbox", { name: "Publish profile" }).check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile saved and published.")).toBeVisible();

    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    await expect(page.getByRole("heading", { name: "E2E MEMBER A" })).toBeVisible();
    await expect(page.getByText("E2E browser-test engineer")).toBeVisible();

    await page.goto(`/members/${process.env.E2E_MEMBER_B_SLUG}`);
    await expect(page.getByRole("heading", { name: "E2E MEMBER B" })).toBeVisible();
    await expect(page.getByText("E2E browser-test engineer")).toHaveCount(0);
  });

  test("manages owned skills and social links without changing another member", async ({ page }) => {
    test.setTimeout(60_000);
    const skillName = process.env.E2E_SKILL_NAME!;
    const linkUrl = "https://example.com/e2e-member-a";

    await page.goto("/admin/profile/skills");
    const skillCreator = page.getByRole("region", { name: "Add skill" });
    await skillCreator.getByLabel("Skill name").fill(skillName);
    await skillCreator.getByLabel("Category").fill("Browser testing");
    await skillCreator.getByLabel("Proficiency (1–100)").fill("80");
    await skillCreator.getByRole("button", { name: "Add skill" }).click();
    await expect(skillCreator.getByText("Portfolio entry added.")).toBeVisible();

    await page.reload();
    const skillEditor = page.locator("details").filter({ hasText: skillName });
    await skillEditor.locator("summary").click();
    await skillEditor.getByLabel("Proficiency (1–100)").fill("90");
    await skillEditor.getByRole("button", { name: "Save changes" }).click();
    await expect(skillEditor.getByText("Portfolio entry saved.")).toBeVisible();

    await page.goto("/admin/profile/links");
    const linkCreator = page.getByRole("region", { name: "Add social link" });
    await linkCreator.getByLabel("Platform").fill("E2E Profile");
    await linkCreator.getByLabel("Profile URL").fill(linkUrl);
    await linkCreator.getByRole("button", { name: "Add social link" }).click();
    await expect(linkCreator.getByText("Portfolio entry added.")).toBeVisible();

    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    await expect(page.getByRole("listitem").filter({ hasText: skillName })).toBeVisible();
    await expect(page.getByRole("link", { name: "E2E Profile ↗" })).toHaveAttribute("href", linkUrl);
    await page.goto(`/members/${process.env.E2E_MEMBER_B_SLUG}`);
    await expect(page.getByRole("listitem").filter({ hasText: skillName })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "E2E Profile ↗" })).toHaveCount(0);

    await page.goto("/admin/profile/links");
    const linkEditor = page.locator("details").filter({ hasText: "E2E Profile" });
    await linkEditor.locator("summary").click();
    page.once("dialog", (dialog) => dialog.accept());
    await linkEditor.getByRole("button", { name: "Remove entry" }).click();
    await expect(linkEditor).toHaveCount(0);

    await page.goto("/admin/profile/skills");
    const savedSkill = page.locator("details").filter({ hasText: skillName });
    await savedSkill.locator("summary").click();
    page.once("dialog", (dialog) => dialog.accept());
    await savedSkill.getByRole("button", { name: "Remove entry" }).click();
    await expect(savedSkill).toHaveCount(0);
    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    await expect(page.getByRole("listitem").filter({ hasText: skillName })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "E2E Profile ↗" })).toHaveCount(0);
  });

  test("manages certifications, achievements, and personal-project publication", async ({ page }) => {
    test.setTimeout(90_000);
    const marker = process.env.E2E_MEMBER_A_SLUG!;
    const certificationName = `E2E Certification ${marker}`;
    const achievementTitle = `E2E Achievement ${marker}`;
    const personalProjectTitle = `E2E Personal Project ${marker}`;
    const personalProjectSlug = `personal-${marker}`;

    await page.goto("/admin/profile/certifications");
    const certificationCreator = page.getByRole("region", { name: "Add certification" });
    await certificationCreator.getByLabel("Certification").fill(certificationName);
    await certificationCreator.getByLabel("Issuer").fill("E2E Test Organization");
    await certificationCreator.getByLabel("Issue date").fill("2025-01-01");
    await certificationCreator.getByRole("button", { name: "Add certification" }).click();
    await expect(certificationCreator.getByText("Portfolio entry added.")).toBeVisible();

    await page.goto("/admin/profile/achievements");
    const achievementCreator = page.getByRole("region", { name: "Add achievement" });
    await achievementCreator.getByLabel("Title").fill(achievementTitle);
    await achievementCreator.getByLabel("Description").fill("A disposable browser-test milestone.");
    await achievementCreator.getByRole("button", { name: "Add achievement" }).click();
    await expect(achievementCreator.getByText("Portfolio entry added.")).toBeVisible();

    await page.goto("/admin/profile/projects");
    const projectCreator = page.getByRole("region", { name: "Add personal project" });
    await projectCreator.getByLabel("Title").fill(personalProjectTitle);
    await projectCreator.getByLabel("Slug").fill(personalProjectSlug);
    await projectCreator.getByRole("button", { name: "Add personal project" }).click();
    await expect(projectCreator.getByText("Portfolio entry added.")).toBeVisible();

    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    await expect(page.getByRole("heading", { name: certificationName })).toBeVisible();
    await expect(page.getByRole("heading", { name: achievementTitle })).toBeVisible();
    await expect(page.getByRole("heading", { name: personalProjectTitle })).toHaveCount(0);

    await page.goto("/admin/profile/projects");
    const personalProjectEditor = page.locator("details").filter({ hasText: personalProjectTitle });
    await personalProjectEditor.locator("summary").click();
    await personalProjectEditor.getByRole("checkbox", { name: "Publish this project" }).check();
    await personalProjectEditor.getByRole("button", { name: "Save changes" }).click();
    await expect(personalProjectEditor.getByText("Please correct the highlighted fields.")).toBeVisible();
    await personalProjectEditor.getByLabel("Short description").fill("A verified personal project.");
    await personalProjectEditor.getByRole("textbox", { name: /^Full description/ }).fill("A disposable published project owned by member A.");
    await personalProjectEditor.getByRole("checkbox", { name: "Publish this project" }).check();
    await personalProjectEditor.getByRole("button", { name: "Save changes" }).click();
    await expect(personalProjectEditor.getByText("Portfolio entry saved.")).toBeVisible();

    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    await expect(page.getByRole("heading", { name: personalProjectTitle })).toBeVisible();
    await page.goto(`/members/${process.env.E2E_MEMBER_B_SLUG}`);
    for (const title of [certificationName, achievementTitle, personalProjectTitle]) {
      await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
    }

    for (const [section, title] of [
      ["certifications", certificationName],
      ["achievements", achievementTitle],
      ["projects", personalProjectTitle],
    ] as const) {
      await page.goto(`/admin/profile/${section}`);
      const editor = page.locator("details").filter({ hasText: title });
      await editor.locator("summary").click();
      page.once("dialog", (dialog) => dialog.accept());
      await editor.getByRole("button", { name: "Remove entry" }).click();
      await expect(editor).toHaveCount(0);
    }
    await page.goto(`/members/${process.env.E2E_MEMBER_A_SLUG}`);
    for (const title of [certificationName, achievementTitle, personalProjectTitle]) {
      await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
    }
  });

  test("rejects unsupported, oversized, and spoofed portrait uploads before storage", async ({ page }) => {
    await page.goto("/admin/profile");
    const portraitForm = page.locator("form").filter({ has: page.getByRole("heading", { name: "Profile portrait" }) });
    const fileInput = portraitForm.getByLabel("Image file");

    await fileInput.setInputFiles({ name: "portrait.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    await portraitForm.getByRole("button", { name: "Upload image" }).click();
    await expect(portraitForm.getByText("Use a JPEG, PNG, or WebP image.").first()).toBeVisible();

    await fileInput.setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
    await portraitForm.getByRole("button", { name: "Upload image" }).click();
    await expect(portraitForm.getByText("Images must be 5 MB or smaller.").first()).toBeVisible();

    await fileInput.setInputFiles({ name: "portrait.png", mimeType: "image/png", buffer: Buffer.from("not really a PNG") });
    await portraitForm.getByRole("button", { name: "Upload image" }).click();
    await expect(portraitForm.getByText("The file contents do not match a supported image format.").first()).toBeVisible();
  });
});

test.describe("disposable administrator mutations", () => {
  test.describe("admin A", () => {
    test.use({ storageState: resolve(sessionDirectory, "admin-a.json") });

    test("creates a project draft, validates publication, publishes it, then deletes it", async ({ page }) => {
      test.setTimeout(60_000);
      const slug = process.env.E2E_PROJECT_SLUG!;
      const title = "E2E Disposable Project";
      const technologyName = process.env.E2E_TECHNOLOGY_NAME!;

      await page.goto(`/projects/${slug}`);
      await expect(page.getByRole("heading", { name: "This project is not published." })).toBeVisible();

      await page.goto("/admin/projects");
      const creator = page.locator("details").filter({ hasText: "Create a project" });
      await creator.getByText("Create a project", { exact: true }).click();
      await creator.getByLabel("Project title").fill(title);
      await creator.getByLabel("Public slug").fill(slug);
      await creator.getByRole("button", { name: "Create project" }).click();
      await expect(creator.getByText("Project created as a draft.")).toBeVisible();

      await page.reload();
      const projectRow = page.locator("article").filter({ hasText: title });
      await expect(projectRow.getByText("Draft", { exact: true })).toBeVisible();
      await projectRow.getByRole("link", { name: "View and edit" }).click();
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

      await page.getByRole("checkbox", { name: "Publish project" }).check();
      await page.getByRole("button", { name: "Save project" }).click();
      await expect(page.getByText("Please correct the highlighted fields.")).toBeVisible();
      await expect(page.getByText("Add a thumbnail URL before publishing.")).toBeVisible();

      await page.getByLabel("Short description").fill("A disposable project for browser verification.");
      await page.getByLabel("Full description").fill("This temporary project verifies the full editorial publication flow.");
      await page.getByLabel("Thumbnail URL").fill("https://example.com/e2e-project-thumbnail.png");
      await page.getByRole("checkbox", { name: "Publish project" }).check();
      await page.getByRole("button", { name: "Save project" }).click();
      await expect(page.getByText("Project saved and published.")).toBeVisible();

      await page.reload();
      const membersSection = page.getByRole("region", { name: "Project members" });
      await membersSection.getByLabel("Member").selectOption({ label: "E2E MEMBER B" });
      await membersSection.getByLabel("Project role").first().fill("Browser tester");
      await membersSection.getByRole("button", { name: "Assign member" }).click();
      await expect(membersSection.getByText("Project member assignment saved.")).toBeVisible();

      await page.goto("/admin/technologies");
      await page.getByLabel("Name").first().fill(technologyName);
      await page.getByRole("button", { name: "Create technology" }).click();
      await expect(page.getByText("Technology created.")).toBeVisible();

      await page.goto("/admin/projects");
      await page.locator("article").filter({ hasText: title }).getByRole("link", { name: "View and edit" }).click();
      const technologiesSection = page.getByRole("region", { name: "Technologies" });
      await technologiesSection.getByLabel("Technology").selectOption({ label: technologyName });
      await technologiesSection.getByRole("button", { name: "Assign technology" }).click();
      await expect(technologiesSection.getByRole("button", { name: `${technologyName} ×` })).toBeVisible();

      await page.goto(`/projects/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.getByText(technologyName, { exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /E2E MEMBER B/ })).toBeVisible();
      await page.goto("/projects");
      await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();

      await page.goto("/admin/projects");
      await page.locator("article").filter({ hasText: title }).getByRole("link", { name: "View and edit" }).click();
      await page.getByLabel(`Type ${slug} to confirm`).fill(slug);
      page.once("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: "Permanently delete project" }).click();
      await expect(page).toHaveURL(/\/admin\/projects\?projectDeleted=1$/);
      await expect(page.getByText("Project deleted. Its audit history was retained.")).toBeVisible();

      await page.goto("/admin/technologies");
      const technologyRow = page.locator("article").filter({ hasText: technologyName });
      await technologyRow.getByLabel(`Type ${technologyName} to delete`).fill(technologyName);
      page.once("dialog", (dialog) => dialog.accept());
      await technologyRow.getByRole("button", { name: "Delete technology" }).click();
      await expect(technologyRow).toHaveCount(0);

      await page.goto(`/projects/${slug}`);
      await expect(page.getByRole("heading", { name: "This project is not published." })).toBeVisible();
    });

    test("publishes home-page content and creates a member invitation", async ({ page }) => {
      await page.goto("/admin/team");
      await page.getByLabel("Hero introduction").fill("E2E introduction from administrator A.");
      await page.getByRole("button", { name: "Save team content" }).click();
      await expect(page.getByText("Team content saved and published on the home page.")).toBeVisible();

      await page.goto("/");
      await expect(page.getByText("E2E introduction from administrator A.")).toBeVisible();

      await page.goto("/admin/members");
      const memberInvitation = page.locator("details").filter({ hasText: "Add a member" });
      await memberInvitation.getByLabel("Invited email").fill(process.env.E2E_INVITED_EMAIL!);
      await memberInvitation.getByLabel("Full name").fill("E2E Invited Member");
      await memberInvitation.getByLabel("Public slug").fill(process.env.E2E_INVITED_SLUG!);
      await memberInvitation.getByRole("button", { name: "Create member account" }).click();
      await expect(memberInvitation.getByText("Member account created.", { exact: false })).toBeVisible();
      await expect(page.getByText(process.env.E2E_INVITED_EMAIL!, { exact: true })).toBeVisible();
    });
  });

  test.describe("admin B", () => {
    test.use({ storageState: resolve(sessionDirectory, "admin-b.json") });

    test("can independently change the same home-page content", async ({ page }) => {
      await page.goto("/admin/team");
      await page.getByLabel("Hero introduction").fill("E2E introduction from administrator B.");
      await page.getByRole("button", { name: "Save team content" }).click();
      await expect(page.getByText("Team content saved and published on the home page.")).toBeVisible();

      await page.goto("/");
      await expect(page.getByText("E2E introduction from administrator B.")).toBeVisible();
    });
  });

  test.describe("final administrator", () => {
    test.use({ storageState: resolve(sessionDirectory, "admin-a.json") });

    test("cannot deactivate the last active administrator even with a forged enabled button", async ({ page }) => {
      await page.goto("/admin/members");
      const otherAdmin = page.locator("article").filter({ hasText: process.env.E2E_ADMIN_B_EMAIL! });
      page.once("dialog", (dialog) => dialog.accept());
      await otherAdmin.getByRole("button", { name: "Deactivate" }).click();
      await expect(otherAdmin.getByText("Inactive", { exact: true })).toBeVisible();

      await page.reload();
      const ownAccount = page.locator("article").filter({ hasText: process.env.E2E_ADMIN_A_EMAIL! });
      const deactivate = ownAccount.getByRole("button", { name: "Deactivate" });
      await expect(deactivate).toBeDisabled();
      await deactivate.evaluate((button: HTMLButtonElement) => { button.disabled = false; });
      page.once("dialog", (dialog) => dialog.accept());
      await deactivate.click();
      await expect(ownAccount.getByText("The final active administrator cannot be deactivated.")).toBeVisible();
      await expect(ownAccount.getByText("Active", { exact: true })).toBeVisible();
    });
  });
});
