import { expect, test, type Page } from "@playwright/test";
import {
  installSuccessfulTurnstile,
  rememberAuthentication,
  restoreAuthentication,
} from "./auth-helpers";
import { E2E_FIXTURES, e2eSlotDate } from "./fixtures";

let originalAppointmentId = "";
let replacementAppointmentId = "";

async function signIn(page: Page, email: string) {
  await installSuccessfulTurnstile(page);
  if (
    await restoreAuthentication(
      page,
      email,
      email === E2E_FIXTURES.clientEmail ? "/en/client" : "/en/admin",
    )
  ) {
    return false;
  }
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
  if (email === E2E_FIXTURES.clientEmail) {
    await expect(page).toHaveURL(/\/en\/client\/?$/, { timeout: 20_000 });
    await rememberAuthentication(page, email);
    return false;
  }
  return true;
}

async function completeTwoFactor(page: Page, backupCode: string) {
  await expect(page).toHaveURL(/\/en\/two-factor/);
  await page.getByLabel("Backup code").fill(backupCode);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(/\/en\/admin/, { timeout: 20_000 });
}

async function completeTwoFactorWhenRequired(page: Page, email: string, backupCode: string) {
  if (await signIn(page, email)) {
    await completeTwoFactor(page, backupCode);
    await rememberAuthentication(page, email);
  }
}

function appointmentIdFromUrl(page: Page) {
  return new URL(page.url()).pathname.split("/").at(-1) ?? "";
}

async function selectFixtureDate(page: Page) {
  const date = e2eSlotDate();
  await expect(page.locator(".booking-calendar fieldset")).toBeEnabled({ timeout: 20_000 });
  const dateInput = page.getByLabel("Date");
  await dateInput.fill(date);
  await expect(dateInput).toHaveValue(date);
}

test.describe.serial("role-aware appointment journeys", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(browserName !== "chromium" || testInfo.project.name !== "chromium-desktop");
  });

  test("a client books slot A and reschedules it to slot B", async ({ page }) => {
    await signIn(page, E2E_FIXTURES.clientEmail);
    await expect(page).toHaveURL(/\/en\/client/, { timeout: 20_000 });

    await page.goto("/en/client/book");
    await selectFixtureDate(page);
    await page.getByText("11:00", { exact: true }).click();
    await expect(page.getByRole("button", { name: "Submit request" })).toBeDisabled();
    const serviceType = page.getByLabel("Service type");
    await expect(serviceType.locator("option")).toHaveCount(7);
    await serviceType.selectOption("ADULT");
    await page.getByRole("button", { name: "Submit request", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments\/[0-9a-f-]+$/, {
      timeout: 30_000,
    });
    originalAppointmentId = appointmentIdFromUrl(page);
    await expect(page.getByText(/Requested/i)).toBeVisible();
    await expect(page.getByText("Service type: Adult")).toBeVisible();

    await page.getByRole("link", { name: "Reschedule", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Reschedule appointment" })).toBeVisible();
    await expect(page.getByLabel("Service type")).toHaveValue("ADULT");
    await page.getByLabel("Service type").selectOption("FAMILY");
    await selectFixtureDate(page);
    await page.getByText("13:00", { exact: true }).click();
    await page.getByRole("button", { name: "Submit new request" }).click();
    await expect(page).toHaveURL(/\/en\/client\/appointments\/[0-9a-f-]+$/, {
      timeout: 30_000,
    });
    replacementAppointmentId = appointmentIdFromUrl(page);
    expect(replacementAppointmentId).not.toBe(originalAppointmentId);
    await expect(page.getByText(/Requested/i)).toBeVisible();
    await expect(page.getByText("Service type: Family")).toBeVisible();

    await page.goto(`/en/client/appointments/${originalAppointmentId}`);
    await expect(page.getByText(/Cancelled/i)).toBeVisible();
    await expect(page.getByText("Service type: Adult")).toBeVisible();
    await page.goto("/en/client/book");
    await selectFixtureDate(page);
    await expect(page.getByRole("radio", { name: "11:00" })).toHaveCount(1);
  });

  test("the assigned therapist sees and confirms the replacement request", async ({ page }) => {
    await completeTwoFactorWhenRequired(
      page,
      E2E_FIXTURES.therapistEmail,
      E2E_FIXTURES.therapistBackupCode,
    );
    await page.goto(`/en/admin/appointments?week=${e2eSlotDate()}`);
    await expect(page.getByRole("heading", { name: "Appointment calendar" })).toBeVisible();
    const replacement = page.locator(
      `.calendar-management-item[data-appointment-id="${replacementAppointmentId}"]`,
    );
    await expect(replacement).toBeVisible();
    await replacement.locator("summary").click();
    await replacement.getByRole("button", { name: "Approve" }).click();
    await expect(replacement.getByText(/Confirmed/i)).toBeVisible();
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
    await selectFixtureDate(page);
    await expect(page.getByRole("radio", { name: "13:00" })).toHaveCount(1);
  });

  test("cancelled appointments are removed from the active therapist calendar", async ({
    page,
  }) => {
    await completeTwoFactorWhenRequired(
      page,
      E2E_FIXTURES.adminEmail,
      E2E_FIXTURES.adminBackupCode,
    );
    await page.goto(`/en/admin/appointments?week=${e2eSlotDate()}`);
    await expect(page.getByRole("heading", { name: "Appointment calendar" })).toBeVisible();
    await expect(
      page.locator(`.calendar-management-item[data-appointment-id="${replacementAppointmentId}"]`),
    ).toHaveCount(0);
  });
});
