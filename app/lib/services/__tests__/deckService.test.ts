import { ObjectId } from "mongodb";
import { deckService } from "@/app/lib/services/deckService";
import { deckDbService } from "@/app/lib/db/services/deckDbService";
import { cardService } from "@/app/lib/services/cardService";
import { Card } from "@/app/lib/types/card";
import { DeckWithUserInfo } from "@/app/lib/types/deckBrowse";

jest.mock("@/app/lib/db/services/deckDbService", () => ({
  deckDbService: {
    getPublicDecksWithUserInfoPage: jest.fn(),
    countPublicDecks: jest.fn(),
  },
}));

jest.mock("@/app/lib/services/cardService", () => ({
  cardService: {
    getCardsByIds: jest.fn(),
  },
}));

function buildCard(id: string, elementType: Card["element"]["type"]): Card {
  return {
    id,
    name: `Card ${id}`,
    manaCost: 1,
    element: {
      type: elementType,
      symbol: elementType,
    },
    stats: {
      power: 0,
      defense: 0,
      affinity: {},
    },
    timing: {
      type: "Standard",
      description: "",
    },
    typeAndAttributes: {
      mainType: "Unit",
      subType: "",
      attributes: [],
    },
    abilities: [],
    set: {
      symbol: "TST",
      name: "Test Set",
      complexity: "Common",
    },
    imageUrl: "/test.png",
  };
}

function buildDeckWithUserInfo(
  idSeed: number,
  name: string,
  cardId: string,
  createdAt: string
): DeckWithUserInfo {
  return {
    deck: {
      _id: new ObjectId(idSeed.toString(16).padStart(24, "0")),
      name,
      userId: new ObjectId((idSeed + 1000).toString(16).padStart(24, "0")),
      cards: [{ cardId, quantity: 1 }],
      createdAt: new Date(createdAt),
      updatedAt: new Date(createdAt),
      isPublic: true,
      views: idSeed,
      viewedBy: [],
      likes: idSeed,
      likedBy: [],
      deckBadges: [],
    },
    user: {
      name: `User ${idSeed}`,
      username: `user${idSeed}`,
      achievementXp: idSeed,
    },
    isLikedByCurrentUser: false,
    deckElements: [],
  };
}

describe("deckService.getPublicDecksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("filters Dark decks using hydrated card data instead of stale stored deckElements", async () => {
    (deckDbService.getPublicDecksWithUserInfoPage as jest.Mock).mockResolvedValue([
      buildDeckWithUserInfo(1, "Dark Deck", "dark-card", "2026-03-01T12:00:00.000Z"),
      buildDeckWithUserInfo(2, "Fire Deck", "fire-card", "2026-02-01T12:00:00.000Z"),
    ]);
    (cardService.getCardsByIds as jest.Mock).mockResolvedValue([
      buildCard("dark-card", "Dark"),
      buildCard("fire-card", "Fire"),
    ]);

    const response = await deckService.getPublicDecksPage({
      sortBy: "newest",
      limit: 36,
      filters: {
        elements: ["Dark"],
      },
    });

    expect(response.total).toBe(1);
    expect(response.decks).toHaveLength(1);
    expect(response.decks[0].deck.name).toBe("Dark Deck");
    expect(deckDbService.countPublicDecks).not.toHaveBeenCalled();

    const dbFiltersArg = (deckDbService.getPublicDecksWithUserInfoPage as jest.Mock)
      .mock.calls[0][4];
    expect(dbFiltersArg).not.toHaveProperty("elements");
  });
});
