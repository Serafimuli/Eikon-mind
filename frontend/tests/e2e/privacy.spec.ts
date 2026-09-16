import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import {
  installSuccessfulTurnstile,
  rememberAuthentication,
  restoreAuthentication,
} from "./auth-helpers";
import { E2E_FIXTURES } from "./fixtures";

async function signIn(page: Page) {
  await installSuccessfulTurnstile(page);
  if (await restoreAuthentication(page, E2E_FIXTURES.clientEmail, "/en/client")) return;
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(E2E_FIXTURES.clientEmail);
  await page.getByLabel("Password").fill(E2E_FIXTURES.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/en\/client\/?$/, { timeout: 20_000 });
  await rememberAuthentication(page, E2E_FIXTURES.clientEmail);
}

test("legal notices publish the required English content without analytics requests", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/en/politica-de-confidentialitate");
  await expect(
    page.getByRole("heading", { name: "Privacy and data-processing notice" }),
  ).toBeVisible();
  await expect(page.getByText("Article 9(2)(h) GDPR", { exact: false })).toBeVisible();
  await expect(page.getByText("30 days", { exact: false })).toBeVisible();

  await page.goto("/en/politica-de-cookies");
  await expect(
    page.getByRole("heading", { name: "Cookie and similar technologies policy" }),
  ).toBeVisible();
  const visibleTechnologyDetails = page.locator(
    ".legal-table-wrap:visible, .legal-table-cards:visible",
  );
  await expect(
    visibleTechnologyDetails.getByText("__Secure-better-auth.session_token"),
  ).toBeVisible();
  await expect(
    visibleTechnologyDetails.getByText("eikon-music-enabled (localStorage)"),
  ).toBeVisible();

  expect(requests.join("\n")).not.toMatch(
    /google-analytics|googletagmanager|facebook\.net|connect\.facebook/i,
  );
});

test("login and registration show a privacy notice before Google sign-in", async ({ page }) => {
  for (const path of ["/en/login", "/en/register"]) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: /data-processing notice/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /how we process Google data/i })).toBeVisible();
  }
});

test.describe("mobile cookie policy", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only legal layout");
    await page.setViewportSize({ width: 390, height: 844 });
  });

  for (const locale of ["en", "ro"] as const) {
    test(`${locale} cookie details use readable cards without horizontal overflow`, async ({
      page,
    }) => {
      await page.goto(`/${locale}/politica-de-cookies`);

      await expect(page.locator(".legal-table-wrap")).toBeHidden();
      await expect(page.locator(".legal-table-cards")).toBeVisible();
      await expect(page.locator(".legal-table-card")).not.toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        ),
      ).toBe(false);

      const cardsFitViewport = await page.locator(".legal-table-card").evaluateAll((cards) =>
        cards.every((card) => {
          const bounds = card.getBoundingClientRect();
          return bounds.left >= 0 && bounds.right <= document.documentElement.clientWidth;
        }),
      );
      expect(cardsFitViewport).toBe(true);
    });
  }
});

test("local runtime uses the essential auth cookie and stores a theme only after a choice", async ({
  page,
}) => {
  await page.goto("/en");
  expect(await page.evaluate(() => localStorage.getItem("eikon-theme"))).toBeNull();
  await page.getByRole("button", { name: "Toggle theme" }).click();
  expect(await page.evaluate(() => localStorage.getItem("eikon-theme"))).toBe("dark");

  await signIn(page);
  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "better-auth.session_token",
  );
  expect(sessionCookie).toMatchObject({ httpOnly: true, sameSite: "Lax", secure: false });
  expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1_000 + 6 * 24 * 60 * 60);
  expect(sessionCookie?.expires).toBeLessThan(Date.now() / 1_000 + 8 * 24 * 60 * 60);
});

test("privacy export requires authentication and returns a no-store attachment for the signed-in user", async ({
  page,
}) => {
  const unauthenticated = await page.goto("/api/privacy/export");
  expect(unauthenticated?.status()).toBe(401);
  expect(unauthenticated?.headers()["cache-control"]).toContain("no-store");

  await signIn(page);
  await page.goto("/en/client/profile");
  await expect(page.getByRole("heading", { name: "Download your data" })).toBeVisible();

  const responsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/privacy/export",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download export" }).click();
  const [response, download] = await Promise.all([responsePromise, downloadPromise]);

  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["content-disposition"]).toContain("attachment");
  expect(download.suggestedFilename()).toBe("eikon-mind-personal-data.json");

  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const data = JSON.parse(await readFile(downloadedPath!, "utf8")) as Record<string, unknown>;
  expect((data.account as { email: string }).email).toBe(E2E_FIXTURES.clientEmail);
  expect(JSON.stringify(data)).not.toMatch(
    /password|secret|token|backup|security|therapistId|clientId/i,
  );
});
