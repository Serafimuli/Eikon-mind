import { expect, test, type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./fixtures";

async function signIn(page: Page, email: string) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(E2E_FIXTURES.password);
  const submit = page.getByRole("button", { name: "Sign in" });
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  const authResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && response.url().includes("/api/auth/sign-in/email"),
  );
  await submit.click();
  const response = await authResponse;
  if (!response.ok()) {
    throw new Error(`Sign-in request failed with HTTP ${response.status()}`);
  }
}

test.describe.serial("role-aware user journeys", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(browserName !== "chromium" || testInfo.project.name !== "chromium-desktop");
  });

  test("a verified client can book the therapist's open slot", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.clientEmail);
    await expect(page).toHaveURL(/\/en\/client/, { timeout: 20_000 });
    await page.goto("/en/client/book");
    await page.getByLabel("Available time").selectOption(E2E_FIXTURES.slotId);
    await page.getByRole("button", { name: "Book", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments\/[0-9a-f-]+$/, {
      timeout: 30_000,
    });
    await expect(page.getByText(/Requested/i)).toBeVisible();
  });

  test("the assigned therapist completes 2FA and can manage appointments", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.therapistEmail);
    await expect(page).toHaveURL(/\/en\/two-factor/);
    await page.getByLabel("Backup code").fill(E2E_FIXTURES.therapistBackupCode);
    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page).toHaveURL(/\/en\/admin/, { timeout: 20_000 });
    await page.goto("/en/admin/appointments");
    await expect(page.getByRole("heading", { name: "Appointments" })).toBeVisible();
    await expect(page.getByText("E2E").first()).toBeVisible();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/Confirmed/i)).toBeVisible();
  });
});
