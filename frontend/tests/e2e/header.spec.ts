import { expect, test } from "@playwright/test";

test.describe("public header services menu on desktop", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop-only header interaction");
  });

  test("desktop hover keeps the dropdown open across the trigger-to-list transition", async ({
    page,
  }) => {
    await page.goto("/en");

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await expect(dropdown).toHaveCSS("opacity", "0");
    await trigger.hover();
    await expect(dropdown).toHaveCSS("opacity", "1");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await dropdown.getByRole("link").first().hover();
    await expect(dropdown).toHaveCSS("opacity", "1");

    await page.locator("main").hover({ position: { x: 20, y: 20 } });
    await expect(dropdown).toHaveCSS("opacity", "0");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("desktop click does not lock the dropdown open", async ({ page }) => {
    await page.goto("/en");

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await trigger.hover();
    await trigger.click();
    await expect(dropdown).toHaveCSS("opacity", "1");

    await page.locator("main").hover({ position: { x: 20, y: 20 } });
    await expect(dropdown).toHaveCSS("opacity", "0");
  });

  test("keyboard focus keeps the dropdown open while focus is inside the menu", async ({
    page,
  }) => {
    await page.goto("/en");

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await trigger.focus();
    await expect(dropdown).toHaveCSS("opacity", "1");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const submenuLinks = dropdown.getByRole("link");
    await submenuLinks.first().focus();
    await expect(dropdown).toHaveCSS("opacity", "1");

    for (let index = 0; index < (await submenuLinks.count()); index += 1) {
      await page.keyboard.press("Tab");
    }
    await expect(dropdown).toHaveCSS("opacity", "0");
  });
});

test.describe("public header services menu on mobile", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only header interaction");
  });

  test("mobile menu uses tap-to-toggle for the services submenu", async ({ page }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Menu" }).click();

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await expect(dropdown).toBeHidden();
    await trigger.click();
    await expect(dropdown).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await trigger.click();
    await expect(dropdown).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
