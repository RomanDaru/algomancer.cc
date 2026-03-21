import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { ObjectId } from "mongodb";
import PublicDecksClient from "../PublicDecksClient";
import { Deck } from "@/app/lib/types/user";

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

type DeckWithUserInfo = {
  deck: Deck;
  user: { name: string; username: string | null; achievementXp?: number };
  isLikedByCurrentUser: boolean;
  deckElements?: string[];
};

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
    },
    user: {
      name: `User ${id}`,
      username: `user${id}`,
      achievementXp: id,
    },
    isLikedByCurrentUser: false,
    deckElements: ["Fire"],
  };
}

function getDeckCount(container: HTMLElement) {
  const value = container.querySelector("[data-testid='deck-grid-count']")
    ?.textContent;

  return Number(value || 0);
}

function getButtonByText(container: HTMLElement, text: string) {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === text
  ) as HTMLButtonElement | undefined;
}

describe("PublicDecksClient", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: jest.Mock;

  beforeEach(() => {
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
  });

  it("fetches the next public deck page after the initial 36 decks are exhausted", async () => {
    const initialDecks = Array.from({ length: 36 }, (_, index) =>
      buildDeck(index + 1)
    );
    const nextDeckPage = Array.from({ length: 36 }, (_, index) =>
      buildDeck(index + 37)
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        decks: nextDeckPage,
        hasMore: false,
        nextSkip: 72,
      }),
    });

    await act(async () => {
      root.render(
        <PublicDecksClient
          initialDecks={initialDecks}
          initialHasMore={true}
          isAuthenticated={true}
        />
      );
    });

    expect(getDeckCount(container)).toBe(12);

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
    expect(fetchMock.mock.calls[0][0]).toContain("withMeta=1");
    expect(fetchMock.mock.calls[0][0]).toContain("sort=newest");
    expect(fetchMock.mock.calls[0][0]).toContain("skip=36");
    expect(getDeckCount(container)).toBe(48);
  });
});
