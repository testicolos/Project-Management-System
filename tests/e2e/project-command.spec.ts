import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { companies, documents, projectNotes, tasks, userCompanyAccess, users } from "../../src/db/schema";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(process.env.SEED_ADMIN_USERNAME ?? "Admin");
  await page.getByLabel("Password").fill(process.env.SEED_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
}

test("administrator can navigate the complete project workspace", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await signIn(page);
  await expect(page.locator(".brand-name")).toHaveText("Project Managment");
  await expect(page.getByText("QAR only")).toBeVisible();
  await expect(page.locator(".metric").filter({ hasText: "Finalized" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
  await page.getByRole("link", { name: /Head Office/ }).click();
  await expect(page).toHaveURL(/\/projects\?company=/);
  const companyId = new URL(page.url()).searchParams.get("company");
  await page.getByRole("link", { name: /Project Managment rollout/ }).click();
  await expect(page.getByRole("heading", { name: "Project Managment rollout" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery tasks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to company portfolio" })).toHaveAttribute("href", `/projects?company=${companyId}`);
  await page.getByRole("link", { name: "Back to company portfolio" }).click();
  await expect(page).toHaveURL(new RegExp(`/projects\\?company=${companyId}`));
  await page.getByRole("link", { name: "Users" }).click();
  await expect(page.getByRole("heading", { name: "Users & access" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobile layout preserves primary navigation", async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Projects" })).toBeVisible();
  const overflow = await page.locator("body").evaluate((body) => body.scrollWidth - body.clientWidth);
  expect(overflow).toBe(0);
});

test("document upload and download round-trip", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Desktop coverage is sufficient for the file round-trip");
  const fixtureName = "verification.txt";
  try {
    await signIn(page);
    await page.getByRole("link", { name: /Project Managment rollout/ }).click();
    await page.getByRole("button", { name: "Upload" }).click();
    await page.getByLabel("Document name").fill("Verification evidence");
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", fixtureName));
    await page.getByRole("button", { name: "Upload document" }).click();
    await expect(page.getByText("Verification evidence.txt")).toBeVisible();
    const row = page.locator(".document-row").filter({ hasText: "Verification evidence.txt" });
    const downloadPromise = page.waitForEvent("download");
    await row.getByRole("link", { name: "Download" }).click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    expect(await readFile(downloadedPath!, "utf8")).toContain("Project Managment document verification");
  } finally {
    await db.delete(documents).where(eq(documents.name, "Verification evidence.txt"));
  }
});

test("read-only users cannot access administration", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Role enforcement is viewport-independent");
  const email = "qa-viewer@projectcommand.local";
  const username = "qa-viewer";
  const password = "ReadOnly!QA2026";
  const [company] = await db.select({ id: companies.id }).from(companies).limit(1);
  const [viewer] = await db.insert(users).values({ name: "QA Viewer", username, email, passwordHash: await hash(password, 12), role: "READ_ONLY" })
    .onConflictDoUpdate({ target: users.email, set: { username, passwordHash: await hash(password, 12), role: "READ_ONLY", active: true } })
    .returning({ id: users.id });
  await db.insert(userCompanyAccess).values({ userId: viewer.id, companyId: company.id }).onConflictDoNothing();
  try {
    await page.goto("/login");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Companies" })).toHaveCount(0);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/?error=Administrator/);
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible();
  } finally {
    await db.delete(users).where(eq(users.email, email));
  }
});

test("app exposes an installable desktop PWA manifest", async ({ page, request }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe("Project Managment");
  expect(manifest.short_name).toBe("Project Managment");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({ sizes: "192x192" }), expect.objectContaining({ sizes: "512x512" })]));
  const workerResponse = await request.get("/sw.js");
  expect(workerResponse.ok()).toBe(true);
  await page.goto("/login");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest");
});

test("administrator can add a project note and change task status inline", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Mutation coverage is viewport-independent");
  const noteText = "QA note added from project details";
  const [task] = await db.select({ id: tasks.id, status: tasks.status }).from(tasks).where(eq(tasks.title, "Confirm company portfolio access")).limit(1);
  try {
    await signIn(page);
    await page.getByRole("link", { name: /Project Managment rollout/ }).click();
    await page.getByRole("button", { name: "Add note" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Note", { exact: true }).fill(noteText);
    await dialog.getByRole("button", { name: "Add note", exact: true }).click();
    await expect(page.getByText(noteText)).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Status for Confirm company portfolio access").selectOption("DONE");
    await expect(page.getByLabel("Status for Confirm company portfolio access")).toHaveValue("DONE", { timeout: 15_000 });
  } finally {
    await db.delete(projectNotes).where(eq(projectNotes.content, noteText));
    if (task) await db.update(tasks).set({ status: task.status }).where(eq(tasks.id, task.id));
  }
});

test("create-user errors stay in the popup and an 8-character password is accepted", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Administration coverage is viewport-independent");
  const email = "qa-created@projectcommand.local";
  try {
    await db.delete(users).where(eq(users.email, email));
    await signIn(page);
    await page.getByRole("link", { name: "Users" }).click();
    await page.getByRole("button", { name: "New user" }).click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Full name").fill("QA Created User");
    await dialog.getByLabel("Username").fill("qa-created");
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("Temporary password").fill("Eight@99");
    await dialog.getByRole("button", { name: "Create user" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Choose at least one company");
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="companyIds"]').first().check();
    await dialog.getByRole("button", { name: "Create user" }).click();
    await expect(page.getByText("User created")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator(".user-row-table").filter({ hasText: "QA Created User" })).toBeVisible();
    await page.getByRole("button", { name: "New user" }).click();
    const duplicateDialog = page.locator("dialog[open]");
    await duplicateDialog.getByLabel("Full name").fill("Duplicate Username Check");
    await duplicateDialog.getByLabel("Username").fill("qa-created");
    await duplicateDialog.getByLabel("Email").fill("qa-created-second@projectcommand.local");
    await duplicateDialog.getByLabel("Temporary password").fill("Eight@99");
    await duplicateDialog.locator('input[name="companyIds"]').first().check();
    await duplicateDialog.getByRole("button", { name: "Create user" }).click();
    await expect(duplicateDialog.getByRole("alert")).toHaveText("That username is already in use");
  } finally {
    await db.delete(users).where(eq(users.email, email));
  }
});

test("users can change their own password", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Account coverage is viewport-independent");
  const email = "qa-password@projectcommand.local";
  const username = "qa-password";
  const oldPassword = "Current@1";
  const newPassword = "Changed@2";
  const [company] = await db.select({ id: companies.id }).from(companies).limit(1);
  await db.delete(users).where(eq(users.email, email));
  const [account] = await db.insert(users).values({ name: "QA Password User", username, email, passwordHash: await hash(oldPassword, 12), role: "READ_ONLY" }).returning({ id: users.id });
  await db.insert(userCompanyAccess).values({ userId: account.id, companyId: company.id });
  try {
    await page.goto("/login");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(oldPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Account" }).click();
    await page.getByLabel("Current password").fill(oldPassword);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password changed. Sign in with your new password")).toBeVisible({ timeout: 15_000 });
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible({ timeout: 15_000 });
  } finally {
    await db.delete(users).where(eq(users.email, email));
  }
});

test("administrator can revoke access and change another user's password", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Administration coverage is viewport-independent");
  const email = "qa-managed@projectcommand.local";
  const username = "qa-managed";
  const [company] = await db.select({ id: companies.id }).from(companies).limit(1);
  await db.delete(users).where(eq(users.email, email));
  const [managed] = await db.insert(users).values({ name: "QA Managed User", username, email, passwordHash: await hash("Original@1", 12), role: "READ_ONLY" }).returning({ id: users.id });
  await db.insert(userCompanyAccess).values({ userId: managed.id, companyId: company.id });
  try {
    await signIn(page);
    await page.getByRole("link", { name: "Users" }).click();
    const row = page.locator(".user-row-table").filter({ hasText: "QA Managed User" });
    await row.getByRole("button", { name: "Manage" }).click();
    let dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Access status").selectOption("false");
    await dialog.getByRole("button", { name: "Save access" }).click();
    await expect(row.locator(".status")).toHaveText("Revoked", { timeout: 15_000 });
    await row.getByRole("button", { name: "Manage" }).click();
    dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Set a new password").fill("Managed@2");
    await dialog.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password reset")).toBeVisible({ timeout: 15_000 });
    const [record] = await db.select({ active: users.active, passwordHash: users.passwordHash }).from(users).where(eq(users.id, managed.id)).limit(1);
    expect(record.active).toBe(false);
    expect(await compare("Managed@2", record.passwordHash)).toBe(true);
  } finally {
    await db.delete(users).where(eq(users.email, email));
  }
});
