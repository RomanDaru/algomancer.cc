import { expect, test, type Page, type Route } from "@playwright/test";

type MockPageOptions = {
  start: number;
  count: number;
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  prefix: string;
};

function toObjectId(value: number) {
  return value.toString(16).padStart(24, "0").slice(-24);
}

function buildDeckPageResponse({
  start,
  count,
  total,
  hasMore,
  nextCursor,
  prefix,
}: MockPageOptions) {
  return {
    decks: Array.from({ length: count }, (_, offset) => {
      const index = start + offset;
      const isoDate = `2026-02-${String((index % 28) + 1).padStart(2, "0")}T12:00:00.000Z`;

      return {
        deck: {
          _id: toObjectId(index),
          name: `${prefix} ${index}`,
          userId: toObjectId(index + 5000),
          cards: [],
          deckElements: index % 2 === 0 ? ["Fire"] : ["Water"],
          totalCards: 40,
          createdAt: isoDate,
          updatedAt: isoDate,
          isPublic: true,
          views: index * 10,
          viewedBy: [],
          likes: index * 2,
          likedBy: [],
          deckBadges: index % 2 === 0 ? ["Aggro"] : ["Control"],
        },
        user: {
          name: `Mock User ${index}`,
          username: `mockuser${index}`,
          achievementXp: index * 5,
        },
        isLikedByCurrentUser: false,
        deckElements: index % 2 === 0 ? ["Fire"] : ["Water"],
      };
    }),
    total,
    hasMore,
    nextCursor,
    effectiveLimit: 36,
    warnings: [],
  };
}

async function fulfillPublicDecks(route: Route, response: unknown) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(response),
  });
}

async function mockPublicDeckApi(
  page: Page,
  handler: (route: Route, requestUrl: URL) => Promise<void>
) {
  await page.route("**/api/decks/public?**", async (route) => {
    await handler(route, new URL(route.request().url()));
  });
}

test("loads all public decks across multiple pages", async ({ page }) => {
  await mockPublicDeckApi(page, async (route, requestUrl) => {
    if (requestUrl.searchParams.get("cursor") === "e2e-cursor-1") {
      await fulfillPublicDecks(
        route,
        buildDeckPageResponse({
          start: 37,
          count: 36,
          total: 72,
          hasMore: false,
          nextCursor: null,
          prefix: "Mock Deck",
        })
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/decks?e2e=1");

  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 12 of 72 public decks"
  );

  await page.getByTestId("load-more-decks").click();
  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 24 of 72 public decks"
  );

  await page.getByTestId("load-more-decks").click();
  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 36 of 72 public decks"
  );

  await page.getByTestId("load-more-decks").click();
  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 48 of 72 public decks"
  );

  await page.getByTestId("load-more-decks").click();
  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 60 of 72 public decks"
  );

  await page.getByTestId("load-more-decks").click();
  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 72 of 72 public decks"
  );
  await expect(page.getByTestId("load-more-decks")).toBeHidden();
});

test("refetches the first page when the sort order changes", async ({ page }) => {
  await mockPublicDeckApi(page, async (route, requestUrl) => {
    if (requestUrl.searchParams.get("sort") === "popular") {
      await fulfillPublicDecks(
        route,
        buildDeckPageResponse({
          start: 100,
          count: 36,
          total: 80,
          hasMore: true,
          nextCursor: "popular-cursor-1",
          prefix: "Popular Deck",
        })
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/decks?e2e=1");
  await page.getByLabel("Sort decks").selectOption("popular");

  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 12 of 80 public decks"
  );
  await expect(
    page.getByRole("heading", { name: "Popular Deck 100" })
  ).toBeVisible();
  await expect(page.getByText("Mock Deck 1")).toHaveCount(0);
});

test("searches across more than one results page", async ({ page }) => {
  await mockPublicDeckApi(page, async (route, requestUrl) => {
    const searchQuery = requestUrl.searchParams.get("q");
    const cursor = requestUrl.searchParams.get("cursor");

    if (searchQuery === "dragon" && !cursor) {
      await fulfillPublicDecks(
        route,
        buildDeckPageResponse({
          start: 200,
          count: 12,
          total: 13,
          hasMore: true,
          nextCursor: "search-cursor-1",
          prefix: "Dragon Search Deck",
        })
      );
      return;
    }

    if (searchQuery === "dragon" && cursor === "search-cursor-1") {
      await fulfillPublicDecks(
        route,
        buildDeckPageResponse({
          start: 212,
          count: 1,
          total: 13,
          hasMore: false,
          nextCursor: null,
          prefix: "Dragon Search Deck",
        })
      );
      return;
    }

    await route.abort();
  });

  await page.goto("/decks?e2e=1");
  await page.getByLabel("Search decks").fill("dragon");

  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 12 of 13 public decks"
  );

  await page.getByTestId("load-more-decks").click();

  await expect(page.getByTestId("deck-results-summary")).toHaveText(
    "Showing 13 of 13 public decks"
  );
  await expect(
    page.getByRole("heading", { name: "Dragon Search Deck 212" })
  ).toBeVisible();
});
