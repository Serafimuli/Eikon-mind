import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { E2E_FIXTURES } from "./fixtures";

async function signIn(page: Page) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(E2E_FIXTURES.clientEmail);
  await page.getByLabel("Password").fill(E2E_FIXTURES.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/client\/?$/, { timeout: 20_000 });
}

test("profile settings present responsive, accessible account controls", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/client/profile");

  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email address" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Password" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enable TOTP" })).toBeVisible();

  await page.getByLabel("New email address").fill("first@example.invalid");
  await page.getByLabel("Confirm new address").fill("second@example.invalid");
  await page.getByRole("button", { name: "Send verification" }).click();
  await expect(page.getByText("The email addresses do not match.")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .exclude("iframe")
    .analyze();
  expect(
    results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    ),
  ).toEqual([]);
});

test("TOTP setup displays an SVG QR code and never the raw provisioning URI", async ({ page }) => {
  await signIn(page);
  await page.goto("/en/client/profile");
  await page.route("**/api/auth/two-factor/enable", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        method: "totp",
        totpURI: "otpauth://totp/Eikon%20Mind:client?secret=JBSWY3DPEHPK3PXP",
        backupCodes: ["one-time-code"],
      }),
    });
  });

  const twoFactorCard = page.getByRole("heading", { name: "Enable TOTP" }).locator("..");
  await twoFactorCard.getByLabel("Current password").fill(E2E_FIXTURES.password);
  await twoFactorCard.getByRole("button", { name: "Create TOTP setup" }).click();

  await expect(page.locator(".two-factor-qr svg")).toBeVisible();
  await expect(page.getByText(/otpauth:/i)).toHaveCount(0);
  await expect(page.getByText("one-time-code")).toBeVisible();
});
