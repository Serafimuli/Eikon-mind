import { expect, test, type Page } from "@playwright/test";

const installMediaMock = async (page: Page, blockFirstPlay = false) => {
  await page.addInitScript(
    ({ shouldBlockFirstPlay }) => {
      Object.defineProperty(HTMLMediaElement.prototype, "paused", {
        configurable: true,
        get() {
          return this.dataset.mockPlaying !== "true";
        },
      });

      HTMLMediaElement.prototype.play = function () {
        const playCount = Number(this.dataset.playCount ?? "0") + 1;
        this.dataset.playCount = String(playCount);

        if (shouldBlockFirstPlay && playCount === 1) {
          return Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError"));
        }

        this.dataset.mockPlaying = "true";
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      };

      HTMLMediaElement.prototype.pause = function () {
        const wasPlaying = this.dataset.mockPlaying === "true";
        this.dataset.mockPlaying = "false";
        if (wasPlaying) this.dispatchEvent(new Event("pause"));
      };
    },
    { shouldBlockFirstPlay: blockFirstPlay },
  );
};

const followHeaderLink = async (page: Page, href: string) => {
  const link = page.locator(`a[href="${href}"]`).first();
  if (!(await link.isVisible())) {
    await page.getByRole("button", { name: "Menu" }).click();
  }
  await link.click();
};

test("music loops, persists across navigation, and remembers the user's preference", async ({
  page,
}) => {
  await installMediaMock(page);
  await page.goto("/en");

  const music = page.getByTestId("background-music");
  const toggle = page.getByRole("button", { name: "Turn music off" });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(music).toHaveAttribute("src", "/assets/mixkit-finding-myself-993.mp3");
  await expect(music).toHaveAttribute("loop", "");
  await expect(music).toHaveAttribute("preload", "auto");
  expect(await music.evaluate((element) => (element as HTMLAudioElement).volume)).toBe(0.25);
  expect(await music.evaluate((element) => Number(element.dataset.playCount))).toBe(1);

  const position = await toggle.evaluate((element) => getComputedStyle(element).position);
  const bounds = await toggle.boundingBox();
  const viewport = page.viewportSize();
  expect(position).toBe("fixed");
  expect(bounds).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport!.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport!.height);

  await music.evaluate((element) => {
    element.dataset.persistenceMarker = "same-player";
  });
  await followHeaderLink(page, "/en/despre-mine");
  await expect(page).toHaveURL(/\/en\/despre-mine$/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await music.evaluate((element) => element.dataset.persistenceMarker)).toBe("same-player");
  expect(await music.evaluate((element) => Number(element.dataset.playCount))).toBe(1);

  await toggle.click();
  await expect(page.getByRole("button", { name: "Turn music on" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(await page.evaluate(() => localStorage.getItem("eikon-music-enabled"))).toBe("false");

  await followHeaderLink(page, "/en/contact");
  await expect(page).toHaveURL(/\/en\/contact$/);
  await expect(page.getByRole("button", { name: "Turn music on" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await page.reload();
  await expect(page.getByRole("button", { name: "Turn music on" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  expect(
    await page
      .getByTestId("background-music")
      .evaluate((element) => Number(element.dataset.playCount ?? "0")),
  ).toBe(0);

  await page.getByRole("button", { name: "Turn music on" }).click();
  await expect(page.getByRole("button", { name: "Turn music off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => localStorage.getItem("eikon-music-enabled"))).toBe("true");

  await page.reload();
  await expect(page.getByRole("button", { name: "Turn music off" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("blocked autoplay stays off until the user starts the music", async ({ page }) => {
  await installMediaMock(page, true);
  await page.goto("/ro");

  const toggle = page.getByRole("button", { name: "Pornește muzica" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => localStorage.getItem("eikon-music-enabled"))).toBeNull();
  expect(
    await page
      .getByTestId("background-music")
      .evaluate((element) => Number(element.dataset.playCount ?? "0")),
  ).toBe(1);

  await toggle.click();
  await expect(page.getByRole("button", { name: "Oprește muzica" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => localStorage.getItem("eikon-music-enabled"))).toBe("true");
});
