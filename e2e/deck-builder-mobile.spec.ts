import { expect, test } from "@playwright/test";

const cards = [
  {
    id: "card-1",
    name: "Mobile Test Card",
    element: { type: "Fire", symbol: "" },
    manaCost: 1,
    stats: { power: 1, defense: 1, affinity: {} },
    timing: { type: "Standard", description: "" },
    typeAndAttributes: { mainType: "Unit", subType: "Mage", attributes: [] },
    abilities: [],
    set: { symbol: "TST", name: "Test", complexity: "Common" },
    imageUrl: "/file.svg",
  },
];

test("mobile deck builder keeps editing, details and statistics within reach", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/cards", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(cards),
    });
  });

  await page.goto("/decks/create");

  await expect(page.getByRole("tab", { name: "Deck Builder" })).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(page.getByRole("heading", { name: "Card Browser" })).toHaveCount(1);
  await expect(page.getByText("Main 0 · Sideboard 0/15")).toBeVisible();

  const filterToggle = page.getByRole("button", { name: /Show card filters/ });
  await expect(
    page.getByRole("heading", { name: "Filters", exact: true })
  ).toBeHidden();
  await filterToggle.click();
  await expect(page.getByRole("heading", { name: "Filters", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close filters", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Filters", exact: true })
  ).toBeHidden();

  await page.getByRole("button", { name: "+ Deck" }).click();
  await expect(page.getByText("Main 1 · Sideboard 0/15")).toBeVisible();
  await expect(page.getByText("Mobile Test Card added to Main Deck")).toBeVisible();

  const columnCount = () =>
    page.getByAltText("Mobile Test Card card").evaluate((image) => {
      const grid = image.closest(".grid");
      if (!grid) throw new Error("Deck card grid not found");
      return getComputedStyle(grid).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length;
    });

  await expect(
    page.getByRole("button", { name: "Compact Grid View" })
  ).toHaveAttribute("aria-pressed", "true");
  expect(await columnCount()).toBe(2);

  await page.getByRole("button", { name: "Large Grid View" }).click();
  expect(await columnCount()).toBe(1);

  await page.setViewportSize({ width: 800, height: 844 });
  await page.getByRole("button", { name: "Compact Grid View" }).click();
  expect(await columnCount()).toBe(4);
  await page.getByRole("button", { name: "Large Grid View" }).click();
  expect(await columnCount()).toBe(2);

  await page.getByRole("tab", { name: "Deck Information" }).click();
  await expect(page.getByLabel("Deck Name")).toBeVisible();

  await page.getByRole("tab", { name: "Deck Statistics" }).click();
  await expect(page.getByRole("heading", { name: "Deck Statistics" })).toBeVisible();

  const saveButton = page.getByRole("button", { name: "Sign In to Save" });
  await expect(saveButton).toBeVisible();
  const saveBox = await saveButton.boundingBox();
  expect(saveBox).not.toBeNull();
  expect((saveBox?.y || 0) + (saveBox?.height || 0)).toBeLessThanOrEqual(844);
});
