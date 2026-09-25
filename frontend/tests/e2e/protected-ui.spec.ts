import AxeBuilder from "@axe-core/playwright";
import { createOTP } from "@better-auth/utils/otp";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  installSuccessfulTurnstile,
  rememberAuthentication,
  restoreAuthentication,
} from "./auth-helpers";
import { E2E_FIXTURES } from "./fixtures";

const TOTP_SECRET = "JBSWY3DPEHPK3PXP";

type AuditRole = "client" | "therapist" | "admin";

const roles: Record<AuditRole, { email: string; routes: (locale: "en" | "ro") => string[] }> = {
  client: {
    email: E2E_FIXTURES.clientEmail,
    routes: (locale) => [
      `/${locale}/client`,
      `/${locale}/client/appointments`,
      `/${locale}/client/appointments/${E2E_FIXTURES.auditAppointmentId}`,
      `/${locale}/client/appointments/${E2E_FIXTURES.auditAppointmentId}/reschedule`,
      `/${locale}/client/book`,
      `/${locale}/client/profile`,
    ],
  },
  therapist: {
    email: E2E_FIXTURES.therapistEmail,
    routes: (locale) => [
      `/${locale}/admin`,
      `/${locale}/admin/appointments`,
      `/${locale}/client/profile`,
    ],
  },
  admin: {
    email: E2E_FIXTURES.adminEmail,
    routes: (locale) => [
      `/${locale}/admin`,
      `/${locale}/admin/appointments`,
      `/${locale}/admin/staff`,
      `/${locale}/client/profile`,
    ],
  },
};

test.beforeEach(async ({ page }) => {
  await installSuccessfulTurnstile(page);
});

async function signIn(page: Page, role: AuditRole) {
  const destination = role === "client" ? "/en/client" : "/en/admin";
  if (await restoreAuthentication(page, roles[role].email, destination)) return;

  await page.goto("/en/login");
  await page.getByLabel("Email").fill(roles[role].email);
  await page.getByLabel("Password").fill(E2E_FIXTURES.password);
  const submit = page.getByRole("button", { name: "Sign in", exact: true });
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  await submit.click();

  if (role !== "client") {
    await expect(page).toHaveURL(/\/en\/two-factor/, { timeout: 20_000 });
    await page
      .getByLabel("Authenticator code")
      .fill(await createOTP(TOTP_SECRET, { digits: 6, period: 30 }).totp());
    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/admin/, { timeout: 20_000 });
  } else {
    await expect(page).toHaveURL(/\/en\/client\/?$/, { timeout: 20_000 });
  }
  await rememberAuthentication(page, roles[role].email);
}

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    ),
  ).toBe(false);
}

async function expectValidHeadingOrder(page: Page) {
  const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((headings) =>
    headings
      .filter((heading) => {
        const style = getComputedStyle(heading);
        return style.display !== "none" && style.visibility !== "hidden";
      })
      .map((heading) => Number(heading.tagName.slice(1))),
  );
  expect(levels[0]).toBe(1);
  for (let index = 1; index < levels.length; index += 1) {
    expect(levels[index]).toBeLessThanOrEqual(levels[index - 1] + 1);
  }
}

async function expectMinimumTarget(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeGreaterThanOrEqual(44);
  expect(bounds!.height).toBeGreaterThanOrEqual(44);
}

test("all protected role, locale, theme, and viewport states render cleanly", async ({ page }) => {
  test.setTimeout(360_000);

  for (const role of Object.keys(roles) as AuditRole[]) {
    await signIn(page, role);
    for (const theme of ["light", "dark"] as const) {
      await page.evaluate(
        (selectedTheme) => localStorage.setItem("eikon-theme", selectedTheme),
        theme,
      );
      for (const locale of ["en", "ro"] as const) {
        for (const route of roles[role].routes(locale)) {
          const response = await page.goto(route);
          expect(response?.ok(), `${route} should return successfully`).toBe(true);
          await expect(page.locator("h1"), `${route} should have a heading`).toBeVisible();
          await page.waitForTimeout(300);
          await expectNoOverflow(page);
          await expectValidHeadingOrder(page);

          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .exclude("iframe")
            .analyze();
          expect(results.violations, `${route} (${theme}) should have zero axe violations`).toEqual(
            [],
          );

          if (locale === "ro") {
            const text = await page.locator("main").innerText();
            for (const fragment of [
              "Data minimisation",
              "Therapist workspace",
              "View appointments",
              "Manage staff",
              "TOTP enabled",
              "TOTP not enrolled",
              "Remove staff role",
              "Make therapist",
              "Make administrator",
            ]) {
              expect(text, `${route} should localize “${fragment}”`).not.toContain(fragment);
            }
          }
        }
      }
    }
  }
});

test("dashboard totals and administrator context reflect the full fixture", async ({ page }) => {
  test.skip(test.info().project.name !== "chromium-desktop", "Desktop fixture assertion");
  await signIn(page, "client");
  await page.goto("/en/client");
  await expect(
    page.getByRole("heading", { name: "Appointments", exact: true }).locator(".."),
  ).toContainText("5");
  await expect(page.locator(".appointment-list a.appointment")).toHaveCount(3);

  await signIn(page, "therapist");
  await page.goto("/en/admin");
  await expect(
    page.getByRole("heading", { name: "Appointments", exact: true }).locator(".."),
  ).toContainText("6");
  await expect(
    page.getByRole("heading", { name: "Upcoming", exact: true }).locator(".."),
  ).toContainText("3");

  await signIn(page, "admin");
  await page.goto("/en/admin/appointments");
  await expect(
    page.getByRole("heading", { name: "Appointment calendar", exact: true }),
  ).toBeVisible();
});

test("therapist workweek places overlaps accessibly across locales, themes, and widths", async ({
  page,
}) => {
  await signIn(page, "therapist");

  for (const theme of ["light", "dark"] as const) {
    await page.evaluate(
      (selectedTheme) => localStorage.setItem("eikon-theme", selectedTheme),
      theme,
    );
    for (const locale of ["en", "ro"] as const) {
      for (const viewport of [
        { width: 1440, height: 1000 },
        { width: 390, height: 844 },
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(`/${locale}/admin/appointments?week=2027-03-01`);
        await expect(
          page.getByRole("heading", {
            name: locale === "ro" ? "Calendar programări" : "Appointment calendar",
          }),
        ).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(
          theme === "dark",
        );
        await expect(page.locator(".calendar-day-heading")).toHaveCount(5);
        await expect(page.locator(".calendar-event--appointment")).toHaveCount(2);
        await expectNoOverflow(page);

        const events = page.locator(".calendar-event--appointment");
        const first = await events.nth(0).boundingBox();
        const second = await events.nth(1).boundingBox();
        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(first!.y).toBeLessThan(second!.y);
        expect(first!.x + first!.width).toBeLessThanOrEqual(second!.x);
        expect(await events.nth(0).evaluate((element) => getComputedStyle(element).top)).toBe(
          "64px",
        );
        await expect(events.nth(0)).toContainText("E2E Client");
        await expect(events.nth(1)).toContainText("E2E Audit Client");
        await expect(events.nth(0)).toContainText(locale === "ro" ? "Adult" : "Adult");
        await expect(events.nth(1)).toContainText(locale === "ro" ? "Familie" : "Family");

        if (viewport.width < 768) {
          expect(
            await page
              .locator(".calendar-grid-scroll")
              .evaluate((element) => element.scrollWidth > element.clientWidth),
          ).toBe(true);
        }

        const weekendsLink = page.getByRole("link", {
          name: locale === "ro" ? "Afișează weekendul" : "Show weekends",
        });
        await weekendsLink.focus();
        await expect(weekendsLink).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/weekends=1/);
        await expect(page.locator(".calendar-day-heading")).toHaveCount(7);

        const firstDetails = page.locator(".calendar-management-item").first();
        const summary = firstDetails.locator("summary");
        await summary.focus();
        await expect(summary).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(firstDetails).toHaveAttribute("open", "");
        await expect(
          page.getByRole("button", { name: locale === "ro" ? "Aprobă" : "Approve" }),
        ).toBeVisible();
      }
    }
  }
});

test("protected actions disclose confirmation and staff eligibility before mutation", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "chromium-desktop", "Desktop interaction assertion");
  await signIn(page, "client");
  await page.goto(`/en/client/appointments/${E2E_FIXTURES.auditAppointmentId}`);
  await page.getByRole("button", { name: "Cancel appointment", exact: true }).click();
  await expect(
    page.getByText("Cancel this appointment and release its future time?"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Back", exact: true })).toBeVisible();

  await signIn(page, "therapist");
  await page.goto("/en/admin/appointments");
  await expect(
    page.getByRole("heading", { name: "Appointment calendar", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Block time", exact: true })).toBeVisible();

  await signIn(page, "admin");
  await page.goto("/en/admin/staff");
  const auditClient = page.locator(".staff-card", { hasText: E2E_FIXTURES.auditClientEmail });
  await expect(auditClient.getByText("TOTP not enrolled")).toBeVisible();
  await expect(auditClient.getByRole("button", { name: "Make therapist" })).toBeDisabled();
  await expect(auditClient.getByRole("button", { name: "Make administrator" })).toBeDisabled();
  await expect(auditClient.getByRole("button", { name: "Remove staff role" })).toHaveCount(0);

  const therapist = page.locator(".staff-card", { hasText: E2E_FIXTURES.therapistEmail });
  await expect(therapist.getByRole("button", { name: "Make therapist" })).toHaveCount(0);
  await therapist.getByRole("button", { name: "Make administrator" }).click();
  await expect(therapist.getByText(/Change E2E Therapist’s role to Administrator/)).toBeVisible();
  await expect(therapist.getByRole("button", { name: "Confirm role change" })).toBeVisible();

  const roleChangeTarget = page.locator(".staff-card", {
    hasText: E2E_FIXTURES.roleChangeTargetEmail,
  });
  await roleChangeTarget.getByRole("button", { name: "Make administrator" }).click();
  await roleChangeTarget.getByRole("button", { name: "Confirm role change" }).click();
  await expect(roleChangeTarget.getByText("Administrator", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(roleChangeTarget.getByText("The staff role could not be changed.")).toHaveCount(0);
  await page.goto("/en/admin/staff");
  await expect(
    page
      .locator(".staff-card", { hasText: E2E_FIXTURES.roleChangeTargetEmail })
      .getByText("Administrator", { exact: true }),
  ).toBeVisible();
});

test("unauthorized roles return to their localized dashboard with an explanation", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "chromium-desktop", "Desktop redirect assertion");
  await signIn(page, "client");
  await page.goto("/ro/admin/staff");
  await expect(page).toHaveURL(/\/ro\/client\?notice=access-denied$/);
  await expect(page.getByText(/Nu ai acces la pagina respectivă/)).toBeVisible();

  await signIn(page, "therapist");
  await page.goto("/en/admin/staff");
  await expect(page).toHaveURL(/\/en\/admin\?notice=access-denied$/);
  await expect(page.getByText(/You do not have access to that page/)).toBeVisible();
});

test("mobile private navigation is top-aligned, modal, role-aware, and target-sized", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "chromium-mobile", "Mobile-only navigation assertion");
  await signIn(page, "admin");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en/admin");

  const musicToggle = page.locator(".music-toggle");
  await expect(musicToggle).toHaveAccessibleName("Turn music on");
  await expectMinimumTarget(musicToggle);
  await expect(musicToggle).toHaveCSS("position", "fixed");
  await expect(musicToggle).toHaveCSS("right", "16px");
  await expect(musicToggle).toHaveCSS("bottom", "16px");
  await expectMinimumTarget(page.getByRole("button", { name: "Toggle theme" }));
  await expectMinimumTarget(page.getByRole("button", { name: "Menu" }));
  await expectMinimumTarget(page.getByRole("link", { name: "Manage staff" }));

  await page.goto("/en/client/profile");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const backToTop = page.getByRole("button", { name: "Back to top" });
  await expect(backToTop).toBeVisible();
  await expect(backToTop).toHaveCSS("position", "fixed");
  await expect(backToTop).toHaveCSS("right", "16px");
  await expect(backToTop).toHaveCSS("bottom", "76px");
  const menuButton = page.getByRole("button", { name: "Menu" });
  await menuButton.click();

  const navigation = page.getByLabel("Account navigation");
  await expect(navigation.getByRole("link", { name: "Dashboard" })).toBeFocused();
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect(musicToggle).toHaveAttribute("inert", "");
  await expect(musicToggle).toBeHidden();
  await expect(backToTop).toBeHidden();
  await expect(navigation.getByRole("link", { name: "Profile" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(navigation.getByText("Administrator", { exact: true })).toBeVisible();
  await expect(navigation.getByRole("button", { name: "Log out" })).toBeVisible();

  const lastLinkBounds = await navigation.getByRole("button", { name: "Log out" }).boundingBox();
  expect(lastLinkBounds).not.toBeNull();
  expect(lastLinkBounds!.y + lastLinkBounds!.height).toBeLessThanOrEqual(844);

  const closeButton = page.getByRole("button", { name: "Close" });
  await closeButton.focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Eikon Mind" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menuButton).toBeFocused();
  await expect(navigation).toBeHidden();
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await expect(musicToggle).toBeVisible();

  await page.getByRole("button", { name: "Menu" }).click();
  await navigation.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/en\/client\/profile$/);
  await expect(navigation).toBeHidden();
});
