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

    await expect(dropdown).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-controls", "public-services-dropdown");
    await trigger.hover();
    await expect(dropdown).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await dropdown.getByRole("link").first().hover();
    await expect(dropdown).toBeVisible();

    await page.locator("main").hover({ position: { x: 20, y: 20 } });
    await expect(dropdown).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("desktop click does not lock the dropdown open", async ({ page }) => {
    await page.goto("/en");

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await trigger.hover();
    await trigger.click();
    await expect(dropdown).toBeVisible();

    await page.locator("main").hover({ position: { x: 20, y: 20 } });
    await expect(dropdown).toBeHidden();
  });

  test("keyboard focus keeps the dropdown open while focus is inside the menu", async ({
    page,
  }) => {
    await page.goto("/en");

    const serviceMenu = page.locator(".service-menu");
    const trigger = serviceMenu.getByRole("button", { name: /services/i });
    const dropdown = serviceMenu.locator(".service-dropdown");

    await trigger.focus();
    await expect(dropdown).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const submenuLinks = dropdown.getByRole("link");
    await submenuLinks.first().focus();
    await expect(dropdown).toBeVisible();

    for (let index = 0; index < (await submenuLinks.count()); index += 1) {
      await page.keyboard.press("Tab");
    }
    await expect(dropdown).toBeHidden();
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

  test("mobile menu contains focus, hides the page, and restores focus when closed", async ({
    page,
  }) => {
    await page.goto("/en");

    const menuButton = page.getByRole("button", { name: "Menu" });
    const main = page.locator("main");
    const footer = page.locator("footer");
    await menuButton.click();

    await expect(
      page.getByLabel("Main navigation").getByRole("link", { name: "Home", exact: true }),
    ).toBeFocused();
    await expect(main).toHaveAttribute("inert", "");
    await expect(footer).toHaveAttribute("inert", "");
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Eikon Mind" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(closeButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
    await expect(page.locator("#public-navigation")).toBeHidden();
    await expect(main).not.toHaveAttribute("inert", "");
    await expect(footer).not.toHaveAttribute("inert", "");
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  });
});
