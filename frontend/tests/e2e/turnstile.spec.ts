import { expect, test } from "@playwright/test";

const turnstileScriptUrl = "**/turnstile/v0/api.js?render=explicit";

test("failed verification can be retried without refreshing the English sign-in page", async ({
  page,
}) => {
  let scriptRequests = 0;
  await page.route(turnstileScriptUrl, async (route) => {
    scriptRequests += 1;
    if (scriptRequests === 1) {
      await route.abort();
      return;
    }

    await route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile = {
        render: function (element, options) {
          element.dataset.mockTurnstile = "ready";
          options.callback("e2e-turnstile-token");
          return "e2e-widget";
        },
        remove: function () {}
      };`,
    });
  });

  await page.goto("/en/login");
  const verificationError = page.locator(".turnstile-error");
  await expect(verificationError).toContainText("Verification could not be loaded");
  await page.getByRole("button", { name: "Retry verification" }).click();

  await expect(page.locator('[data-mock-turnstile="ready"]')).toHaveAttribute(
    "data-mock-turnstile",
    "ready",
  );
  await expect(verificationError).toHaveCount(0);
  expect(scriptRequests).toBe(2);
});

test("verification failure and retry controls are localized in Romanian", async ({ page }) => {
  await page.route(turnstileScriptUrl, async (route) => route.abort());
  await page.goto("/ro/login");

  await expect(page.locator(".turnstile-error")).toContainText(
    "Verificarea nu a putut fi încărcată",
  );
  await expect(page.getByRole("button", { name: "Reîncearcă verificarea" })).toBeVisible();
});
