import { expect, test, type Page } from "@playwright/test";

async function layerOffsets(page: Page) {
  return page.locator("[data-parallax-layer]").evaluateAll((layers) =>
    Object.fromEntries(layers.map((layer) => [
      layer.getAttribute("data-parallax-layer"),
      new DOMMatrixReadOnly(getComputedStyle(layer).transform).m42,
    ])),
  );
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 720 },
]) {
  test(`landing composition and scroll-only parallax at ${viewport.width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/");
    const scene = page.locator("[data-landing-scene]");
    await expect(page.getByRole("heading", { name: "Algomancy.", exact: true })).toBeVisible();
    await expect(scene.locator("img")).toHaveCount(5);
    await expect.poll(() => scene.locator("img").evaluateAll((images) =>
      images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
    )).toBe(true);
    // Wait for the client effect, not only the server-rendered artwork.
    await expect(scene.locator("[data-parallax-layer='sky']")).toHaveAttribute("style", /translate3d/);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await page.getByRole("main").count()).toBe(1);
    await expect(page.getByRole("link", { name: "Create a deck", exact: true })).toHaveAttribute("href", "/decks/create");
    await expect(page.getByRole("link", { name: "Browse decks", exact: true })).toHaveAttribute("href", "/decks");

    const composition = await scene.evaluate((element) => {
      const layers = [...element.querySelectorAll<HTMLElement>("[data-parallax-layer]")];
      const figure = layers.find((layer) => layer.dataset.parallaxLayer === "figure")!;
      const art = figure.getBoundingClientRect();
      const copy = element.querySelector("h1")!.parentElement!.getBoundingClientRect();
      const backgrounds = layers.filter((layer) => layer !== figure && getComputedStyle(layer).display !== "none");
      return {
        opaque: layers.every((layer) => getComputedStyle(layer).opacity === "1"),
        sameFrame: backgrounds.every((layer) => {
          const bounds = layer.getBoundingClientRect();
          const first = backgrounds[0].getBoundingClientRect();
          return bounds.x === first.x && bounds.y === first.y && bounds.width === first.width && bounds.height === first.height;
        }),
        separateFigure: art.left >= copy.right || art.top >= copy.bottom,
        animations: element.getAnimations({ subtree: true }).length,
      };
    });
    expect(composition).toEqual({ opaque: true, sameFrame: true, separateFigure: true, animations: 0 });
    const initial = await layerOffsets(page);
    await page.waitForTimeout(250);
    expect(await layerOffsets(page)).toEqual(initial);
    await page.screenshot({ path: testInfo.outputPath("landing-top.png"), fullPage: true });

    await page.evaluate(() => window.scrollTo(0, 300));
    await expect.poll(async () => (await layerOffsets(page)).sky).toBeGreaterThan(0);
    const scrolled = await layerOffsets(page);
    expect(scrolled.sky).toBeGreaterThan(scrolled.islands);
    expect(scrolled.islands).toBeGreaterThan(scrolled.water);
    // Chromium reports an identity matrix for display:none elements. The
    // cave frame is intentionally omitted from the narrow mobile crop.
    if (viewport.width >= 768) expect(scrolled.cave).toBeLessThan(0);
    expect(scrolled.figure).toBeLessThan(0);
    await page.waitForTimeout(250);
    expect(await layerOffsets(page)).toEqual(scrolled);
    await page.screenshot({ path: testInfo.outputPath("landing-scrolled.png") });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => layerOffsets(page)).toEqual(initial);
    expect(errors).toEqual([]);
  });
}

test("reduced motion stays static and can be toggled live", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-parallax-layer='sky']")).toHaveAttribute("style", /translate3d/);
  const initial = await layerOffsets(page);
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.waitForTimeout(250);
  expect(await layerOffsets(page)).toEqual(initial);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(async () => (await layerOffsets(page)).sky).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => layerOffsets(page)).toEqual(initial);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the artwork and primary links remain visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Algomancy.", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create a deck", exact: true })).toBeVisible();
    await expect(page.locator("[data-parallax-layer='figure'] img")).toBeVisible();
    await expect.poll(() => page.locator("[data-landing-scene] img").evaluateAll((images) =>
      images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
    )).toBe(true);
  });
});
