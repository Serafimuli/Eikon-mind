import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
