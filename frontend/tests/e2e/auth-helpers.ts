import type { BrowserContext, Page } from "@playwright/test";

export const TURNSTILE_SCRIPT_URL = "**/turnstile/v0/api.js?render=explicit";
type StoredCookie = Awaited<ReturnType<BrowserContext["cookies"]>>[number];

const authenticatedCookies = new Map<string, StoredCookie[]>();

export async function installSuccessfulTurnstile(page: Page) {
  await page.route(TURNSTILE_SCRIPT_URL, async (route) => {
    const token = `e2e-turnstile-${crypto.randomUUID()}`;
    await route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (element, options) {
          element.dataset.mockTurnstile = "ready";
          options.callback(${JSON.stringify(token)});
          return "e2e-widget";
        },
        remove: function () {}
      };`,
    });
  });
}

export async function restoreAuthentication(page: Page, key: string, destination: string) {
  await page.context().clearCookies();
  const cookies = authenticatedCookies.get(key);
  if (!cookies) return false;
  await page.context().addCookies(cookies);
  await page.goto(destination);
  return true;
}

export async function rememberAuthentication(page: Page, key: string) {
  authenticatedCookies.set(key, await page.context().cookies());
}
