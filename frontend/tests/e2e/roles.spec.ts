import { expect, test, type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./fixtures";

let originalAppointmentId = "";
let replacementAppointmentId = "";

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

async function completeTwoFactor(page: Page, backupCode: string) {
  await expect(page).toHaveURL(/\/en\/two-factor/);
  await page.getByLabel("Backup code").fill(backupCode);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/en\/admin/, { timeout: 20_000 });
}

function appointmentIdFromUrl(page: Page) {
  return new URL(page.url()).pathname.split("/").at(-1) ?? "";
}

test.describe.serial("role-aware appointment journeys", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(browserName !== "chromium" || testInfo.project.name !== "chromium-desktop");
  });

  test("a client books slot A and reschedules it to slot B", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.clientEmail);
    await expect(page).toHaveURL(/\/en\/client/, { timeout: 20_000 });

    await page.goto("/en/client/book");
    await page.getByLabel("Available time").selectOption(E2E_FIXTURES.slotId);
    await page.getByRole("button", { name: "Book", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments\/[0-9a-f-]+$/, {
      timeout: 30_000,
    });
    originalAppointmentId = appointmentIdFromUrl(page);
    await expect(page.getByText(/Requested/i)).toBeVisible();

    await page.getByRole("link", { name: "Reschedule", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Reschedule appointment" })).toBeVisible();
    await page.getByLabel("Available time").selectOption(E2E_FIXTURES.rescheduleSlotId);
    await page.getByRole("button", { name: "Confirm new time" }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments\/[0-9a-f-]+$/, {
      timeout: 30_000,
    });
    replacementAppointmentId = appointmentIdFromUrl(page);
    expect(replacementAppointmentId).not.toBe(originalAppointmentId);
    await expect(page.getByText(/Requested/i)).toBeVisible();

    await page.goto(`/en/client/appointments/${originalAppointmentId}`);
    await expect(page.getByText(/Cancelled/i)).toBeVisible();
    await page.goto("/en/client/book");
    await expect(
      page.getByLabel("Available time").locator(`option[value="${E2E_FIXTURES.slotId}"]`),
    ).toHaveCount(1);
  });

  test("the assigned therapist sees and confirms the replacement request", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.therapistEmail);
    await completeTwoFactor(page, E2E_FIXTURES.therapistBackupCode);
    await page.goto("/en/admin/appointments");
    await expect(page.getByRole("heading", { name: "Appointments" })).toBeVisible();
    await expect(page.getByText("E2E").first()).toBeVisible();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/Confirmed/i)).toBeVisible();
  });

  test("deleting the replacement hides it from the client and releases slot B", async ({
    page,
  }) => {
    await signIn(page, E2E_FIXTURES.clientEmail);
    await expect(page).toHaveURL(/\/en\/client/, { timeout: 20_000 });
    await page.goto(`/en/client/appointments/${replacementAppointmentId}`);
    await expect(page.getByText(/Confirmed/i)).toBeVisible();
    await page.getByLabel("I confirm that I want to delete this appointment.").check();
    await page.getByRole("button", { name: "Delete appointment" }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments$/, { timeout: 20_000 });
    await expect(
      page.locator(`a[href$="/client/appointments/${replacementAppointmentId}"]`),
    ).toHaveCount(0);

    const hiddenResponse = await page.goto(`/en/client/appointments/${replacementAppointmentId}`);
    expect(hiddenResponse?.status()).toBe(404);
    await page.goto("/en/client/book");
    await expect(
      page.getByLabel("Available time").locator(`option[value="${E2E_FIXTURES.rescheduleSlotId}"]`),
    ).toHaveCount(1);
  });

  test("staff retain the hidden appointment as cancelled", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.adminEmail);
    await completeTwoFactor(page, E2E_FIXTURES.adminBackupCode);
    await page.goto("/en/admin/appointments");
    await expect(page.getByText(/Cancelled/i)).toHaveCount(2);
  });
});
