import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { ObjectId } from "mongodb";
import PublicDecksClient from "../PublicDecksClient";
import { Deck } from "@/app/lib/types/user";
import { PaginatedDeckResponse } from "@/app/lib/types/deckBrowse";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/app/components/DeckGrid", () => ({
  __esModule: true,
  default: ({
    decksWithUserInfo = [],
  }: {
    decksWithUserInfo?: Array<{ deck: Deck }>;
  }) => (
    <div data-testid='deck-grid-count'>{decksWithUserInfo.length}</div>
  ),
}));

jest.mock("@/app/components/DeckBadge", () => ({
  __esModule: true,
  default: ({ badge }: { badge: string }) => <span>{badge}</span>,
}));

jest.mock("@/app/components/ElementIcon", () => ({
  __esModule: true,
  default: ({ element }: { element: string }) => <span>{element}</span>,
}));

jest.mock("@heroicons/react/24/outline", () => ({
  ChevronDownIcon: () => <svg aria-hidden='true' />,
  MagnifyingGlassIcon: () => <svg aria-hidden='true' />,
}));

type DeckWithUserInfo = PaginatedDeckResponse["decks"][number];

function buildDeck(id: number): DeckWithUserInfo {
  return {
    deck: {
      _id: new ObjectId(),
      name: `Deck ${id}`,
      userId: new ObjectId(),
      cards: [],
      createdAt: new Date(`2026-01-${String((id % 28) + 1).padStart(2, "0")}`),
      updatedAt: new Date(`2026-01-${String((id % 28) + 1).padStart(2, "0")}`),
      isPublic: true,
      views: id,
      viewedBy: [],
      likes: id,
      likedBy: [],
      deckBadges: id % 2 === 0 ? ["Aggro"] : ["Control"],
    },
    user: {
      name: `User ${id}`,
      username: `user${id}`,
      achievementXp: id,
    },
    isLikedByCurrentUser: false,
    deckElements: id % 2 === 0 ? ["Fire"] : ["Water"],
  };
}

function buildResponse({
  start = 1,
  count = 36,
  total = count,
  hasMore = false,
  nextCursor = null,
}: {
  start?: number;
  count?: number;
  total?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
} = {}): PaginatedDeckResponse {
  return {
    decks: Array.from({ length: count }, (_, index) => buildDeck(start + index)),
    total,
    hasMore,
    nextCursor,
    effectiveLimit: 36,
    warnings: [],
  };
}

function getDeckCount(container: HTMLElement) {
  const value = container.querySelector("[data-testid='deck-grid-count']")
    ?.textContent;

  return Number(value || 0);
}

function getButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find((button) => {
    const buttonText = button.textContent?.trim() || "";
    return buttonText === text || buttonText.includes(text);
  }) as HTMLButtonElement | undefined;
}

function getSearchInput(container: HTMLElement) {
  return container.querySelector("input[type='search']") as HTMLInputElement;
}

function getSortSelect(container: HTMLElement) {
  return container.querySelector("select") as HTMLSelectElement;
}

function getButtonByAriaLabel(container: HTMLElement, label: string) {
  return container.querySelector(
    `button[aria-label='${label}']`
  ) as HTMLButtonElement;
}

function dispatchInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function dispatchSelectValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value"
  )?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

async function flushPendingTimers() {
  await act(async () => {
    jest.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

describe("PublicDecksClient", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = jest.fn();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("fetches the next public deck page with cursor after the initial page is exhausted", async () => {
    const initialResponse = buildResponse({
      count: 36,
      total: 72,
      hasMore: true,
      nextCursor: "cursor-1",
    });

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 37,
          count: 36,
          total: 72,
          hasMore: false,
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={initialResponse}
          isAuthenticated={true}
        />
      );
    });

    expect(getDeckCount(container)).toBe(12);
    expect(container.textContent).toContain("Showing 12 of 72 public decks");

    const loadMoreButton = getButtonByText(container, "Load more");
    expect(loadMoreButton).toBeDefined();

    await act(async () => {
      loadMoreButton?.click();
    });

    expect(getDeckCount(container)).toBe(24);
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      loadMoreButton?.click();
    });

    expect(getDeckCount(container)).toBe(36);
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      loadMoreButton?.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/decks/public?");
    expect(fetchMock.mock.calls[0][0]).toContain("withMeta=1");
    expect(fetchMock.mock.calls[0][0]).toContain("sort=newest");
    expect(fetchMock.mock.calls[0][0]).toContain("cursor=cursor-1");
    expect(getDeckCount(container)).toBe(48);
  });

  it("refetches the first page when sort changes", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 100,
          count: 36,
          total: 80,
          hasMore: true,
          nextCursor: "popular-cursor",
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={buildResponse({
            count: 36,
            total: 80,
            hasMore: true,
            nextCursor: "cursor-1",
          })}
          isAuthenticated={true}
        />
      );
    });

    const select = getSortSelect(container);

    await act(async () => {
      dispatchSelectValue(select, "popular");
      jest.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("sort=popular");
    expect(fetchMock.mock.calls[0][0]).not.toContain("cursor=");
    expect(getDeckCount(container)).toBe(12);
  });

  it("sends server-side search params", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 200,
          count: 12,
          total: 12,
          hasMore: false,
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={buildResponse({
            count: 36,
            total: 36,
            hasMore: false,
            nextCursor: null,
          })}
          isAuthenticated={true}
        />
      );
    });

    const searchInput = getSearchInput(container);
    await act(async () => {
      dispatchInputValue(searchInput, "dragon");
      jest.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("q=dragon");
  });

  it("sends selected element filters to the server", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 300,
          count: 12,
          total: 12,
          hasMore: false,
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={buildResponse({
            count: 36,
            total: 36,
            hasMore: false,
            nextCursor: null,
          })}
          isAuthenticated={true}
        />
      );
    });

    const elementsButton = getButtonByAriaLabel(container, "Filter by elements");

    await act(async () => {
      elementsButton.click();
    });

    const fireButton = getButtonByText(container, "Fire");
    expect(fireButton).toBeDefined();

    await act(async () => {
      fireButton?.click();
    });
    await flushPendingTimers();

    expect(fetchMock).toHaveBeenCalled();
    const latestRequestUrl =
      fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0];
    expect(latestRequestUrl).toContain("elements=Fire");
  });

  it("sends selected badge filters to the server", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 320,
          count: 12,
          total: 12,
          hasMore: false,
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={buildResponse({
            count: 36,
            total: 36,
            hasMore: false,
            nextCursor: null,
          })}
          isAuthenticated={true}
        />
      );
    });

    const badgesButton = getButtonByAriaLabel(container, "Filter by deck type");

    await act(async () => {
      badgesButton.click();
    });

    const aggroButton = getButtonByText(container, "Aggro");
    expect(aggroButton).toBeDefined();

    await act(async () => {
      aggroButton?.click();
    });
    await flushPendingTimers();

    expect(fetchMock).toHaveBeenCalled();

    const latestRequestUrl =
      fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0];
    expect(latestRequestUrl).toContain("badges=Aggro");
  });

  it("uses the card endpoint for paginated load more in filtered card mode", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () =>
        buildResponse({
          start: 50,
          count: 24,
          total: 60,
          hasMore: false,
          nextCursor: null,
        }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialResponse={buildResponse({
            count: 36,
            total: 60,
            hasMore: true,
            nextCursor: "card-cursor-1",
          })}
          filteredCard={{
            id: "card-123",
            name: "Flamecaller",
            imageUrl: "/card.png",
            element: { type: "Fire" } as never,
            typeAndAttributes: { mainType: "Spell" } as never,
          }}
          cardId='card-123'
          isAuthenticated={true}
        />
      );
    });

    const loadMoreButton = getButtonByText(container, "Load more");
    expect(loadMoreButton).toBeDefined();

    await act(async () => {
      loadMoreButton?.click();
    });

    await act(async () => {
      loadMoreButton?.click();
    });

    await act(async () => {
      loadMoreButton?.click();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/decks/card/card-123?");
    expect(fetchMock.mock.calls[0][0]).toContain("cursor=card-cursor-1");
  });
});
