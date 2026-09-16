import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";

const publicSlugs = [
  "",
  "adulti",
  "copii-si-adolescenti",
  "familii",
  "seniori",
  "adictii",
  "formare-profesionala",
  "despre-mine",
  "programare",
  "contact",
  "blog-page",
  "anpc-protectia-consumatorilor",
  "politica-de-confidentialitate",
  "politica-de-cookies",
  "termeni-si-conditii",
] as const;

for (const path of ["/en", "/ro", "/en/login"]) {
  test(`${path} is responsive and has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("body")).toBeVisible();

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
}

test("all 30 localized public pages render without serious accessibility or layout defects", async ({
  page,
}) => {
  for (const locale of ["en", "ro"] as const) {
    for (const slug of publicSlugs) {
      const path = `/${locale}${slug ? `/${slug}` : ""}`;
      await page.goto(path);
      await expect(page.locator("h1"), `${path} should have a visible page heading`).toBeVisible();

      const pageState = await page.evaluate(() => ({
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        brokenImages: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.currentSrc || image.src),
      }));
      expect(pageState.horizontalOverflow, `${path} should not overflow horizontally`).toBe(false);
      expect(pageState.brokenImages, `${path} should not contain broken images`).toEqual([]);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .exclude("iframe")
        .analyze();
      expect(
        results.violations.filter(
          (violation) => violation.impact === "serious" || violation.impact === "critical",
        ),
        `${path} should not have serious or critical axe violations`,
      ).toEqual([]);
    }
  }
});

for (const locale of ["en", "ro"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`/${locale}/programare has accessible contrast in ${theme} theme`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => {
        localStorage.setItem("eikon-theme", selectedTheme);
      }, theme);
      await page.goto(`/${locale}/programare`);

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
  }
}

test.describe("mobile touch targets", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only target sizing");
  });

  test("shared public and authentication controls have at least 44px targets", async ({ page }) => {
    const expectMinimumTarget = async (locator: Locator) => {
      await locator.scrollIntoViewIfNeeded();
      const bounds = await locator.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.width).toBeGreaterThanOrEqual(44);
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
    };

    await page.goto("/en");
    await expectMinimumTarget(page.getByRole("button", { name: "Toggle theme" }));
    await expectMinimumTarget(page.getByRole("button", { name: "Menu" }));
    await expectMinimumTarget(page.getByRole("link", { name: "Facebook" }));
    await expectMinimumTarget(page.getByRole("link", { name: "Privacy", exact: true }));

    await page.goto("/en/login");
    await expectMinimumTarget(page.getByRole("button", { name: "Sign in", exact: true }));
    await expectMinimumTarget(page.getByRole("link", { name: /data-processing notice/i }).first());
  });
});

test("Google site verification metadata is present only on localized homepages", async ({
  page,
}) => {
  const verification = page.locator('head meta[name="google-site-verification"]');

  for (const path of ["/en", "/ro"]) {
    await page.goto(path);
    await expect(verification).toHaveCount(1);
    await expect(verification).toHaveAttribute(
      "content",
      "PyRAi0SBOviJ6s8Ir1aFiuqk6UgyMTCe2_KFl7MaHyQ",
    );
  }

  await page.goto("/en/login");
  await expect(verification).toHaveCount(0);
});

test("private areas redirect an unauthenticated visitor to a local sign-in URL", async ({
  page,
}) => {
  await page.goto("/en/client/book");
  await expect(page).toHaveURL(/\/en\/login\?returnTo=%2Fen%2Fclient%2Fbook$/);
});
