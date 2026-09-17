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

test.describe("About Me story layout", () => {
  test("stacks story cards and photos on mobile while preserving alternating order", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only About Me layout");

    for (const locale of ["en", "ro"] as const) {
      await page.goto(`/${locale}/despre-mine`);

      const layout = await page.locator(".about-story__row").evaluateAll((rows) =>
        rows.map((row) => {
          const content = row.querySelector<HTMLElement>(".about-story__content")!;
          const media = row.querySelector<HTMLElement>(".about-story__media");
          const rowRect = row.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          const mediaRect = media?.getBoundingClientRect();

          return {
            columnCount: getComputedStyle(row).gridTemplateColumns.trim().split(/\s+/).length,
            rowWidth: rowRect.width,
            contentWidth: contentRect.width,
            mediaWidth: mediaRect?.width ?? null,
            contentTop: contentRect.top,
            mediaTop: mediaRect?.top ?? null,
          };
        }),
      );

      expect(layout).toHaveLength(4);
      expect(layout.every((row) => row.columnCount === 1)).toBe(true);
      expect(
        layout.every(
          (row) =>
            Math.abs(row.contentWidth - row.rowWidth) < 1 &&
            (row.mediaWidth === null || Math.abs(row.mediaWidth - row.rowWidth) < 1),
        ),
      ).toBe(true);
      expect(layout[0].mediaTop).not.toBeNull();
      expect(layout[1].mediaTop).not.toBeNull();
      expect(layout[2].mediaTop).not.toBeNull();
      expect(layout[0].contentTop).toBeLessThan(layout[0].mediaTop!);
      expect(layout[1].mediaTop!).toBeLessThan(layout[1].contentTop);
      expect(layout[2].contentTop).toBeLessThan(layout[2].mediaTop!);

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    }
  });

  test("keeps story cards and photos in alternating desktop columns", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "Desktop-only About Me layout");

    for (const locale of ["en", "ro"] as const) {
      await page.goto(`/${locale}/despre-mine`);

      const layout = await page.locator(".about-story__row").evaluateAll((rows) =>
        rows.map((row) => {
          const content = row.querySelector<HTMLElement>(".about-story__content")!;
          const media = row.querySelector<HTMLElement>(".about-story__media");
          const rowRect = row.getBoundingClientRect();
          const contentRect = content.getBoundingClientRect();
          const mediaRect = media?.getBoundingClientRect();

          return {
            columnCount: getComputedStyle(row).gridTemplateColumns.trim().split(/\s+/).length,
            rowWidth: rowRect.width,
            contentWidth: contentRect.width,
            mediaWidth: mediaRect?.width ?? null,
            contentLeft: contentRect.left,
            mediaLeft: mediaRect?.left ?? null,
          };
        }),
      );

      expect(layout).toHaveLength(4);
      expect(layout.every((row) => row.columnCount === 2)).toBe(true);
      expect(
        layout
          .slice(0, 3)
          .every(
            (row) =>
              row.contentWidth < row.rowWidth &&
              row.mediaWidth !== null &&
              row.mediaWidth < row.rowWidth &&
              row.mediaLeft !== null &&
              Math.abs(row.contentLeft - row.mediaLeft) > 1,
          ),
      ).toBe(true);
      expect(layout[0].contentLeft).toBeLessThan(layout[0].mediaLeft!);
      expect(layout[1].mediaLeft!).toBeLessThan(layout[1].contentLeft);
      expect(layout[2].contentLeft).toBeLessThan(layout[2].mediaLeft!);
      expect(layout[3].mediaWidth).toBeNull();
    }
  });
});
