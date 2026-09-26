import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { companies, documents, userCompanyAccess, users } from "../../src/db/schema";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(process.env.SEED_ADMIN_EMAIL ?? "admin@projectcommand.qa");
  await page.getByLabel("Password").fill(process.env.SEED_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible();
}

test("administrator can navigate the complete project workspace", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await signIn(page);
  await expect(page.getByText("QAR only")).toBeVisible();
  await page.getByRole("link", { name: /Project Command rollout/ }).click();
  await expect(page.getByRole("heading", { name: "Project Command rollout" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Delivery tasks" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "General notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
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
    await page.getByRole("link", { name: /Project Command rollout/ }).click();
    await page.getByRole("button", { name: "Upload" }).click();
    await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "tests", "fixtures", fixtureName));
    await page.getByRole("button", { name: "Upload document" }).click();
    await expect(page.getByText(fixtureName)).toBeVisible();
    const row = page.locator(".document-row").filter({ hasText: fixtureName });
    const downloadPromise = page.waitForEvent("download");
    await row.getByRole("link", { name: "Download" }).click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    expect(await readFile(downloadedPath!, "utf8")).toContain("Project Command document verification");
  } finally {
    await db.delete(documents).where(eq(documents.name, fixtureName));
  }
});

test("read-only users cannot access administration", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith("desktop"), "Role enforcement is viewport-independent");
  const email = "qa-viewer@projectcommand.local";
  const password = "ReadOnly!QA2026";
  const [company] = await db.select({ id: companies.id }).from(companies).limit(1);
  const [viewer] = await db.insert(users).values({ name: "QA Viewer", email, passwordHash: await hash(password, 12), role: "READ_ONLY" })
    .onConflictDoUpdate({ target: users.email, set: { passwordHash: await hash(password, 12), role: "READ_ONLY", active: true } })
    .returning({ id: users.id });
  await db.insert(userCompanyAccess).values({ userId: viewer.id, companyId: company.id }).onConflictDoNothing();
  try {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Companies" })).toHaveCount(0);
    await page.goto("/users");
    await expect(page).toHaveURL(/\/?error=Administrator/);
    await expect(page.getByRole("heading", { name: "Command center" })).toBeVisible();
  } finally {
    await db.delete(users).where(eq(users.email, email));
  }
});
