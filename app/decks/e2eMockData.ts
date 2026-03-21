import { ObjectId } from "mongodb";
import { PaginatedDeckResponse } from "@/app/lib/types/deckBrowse";

function buildMockDeck(index: number, prefix: string) {
  return {
    deck: {
      _id: new ObjectId(),
      name: `${prefix} ${index}`,
      userId: new ObjectId(),
      cards: [],
      deckElements: index % 2 === 0 ? ["Fire"] : ["Water"],
      totalCards: 40,
      createdAt: new Date(`2026-02-${String((index % 28) + 1).padStart(2, "0")}`),
      updatedAt: new Date(`2026-02-${String((index % 28) + 1).padStart(2, "0")}`),
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
}

export function buildE2EPublicDeckResponse(): PaginatedDeckResponse {
  return {
    decks: Array.from({ length: 36 }, (_, index) =>
      buildMockDeck(index + 1, "Mock Deck")
    ),
    total: 72,
    hasMore: true,
    nextCursor: "e2e-cursor-1",
    effectiveLimit: 36,
    warnings: [],
  };
}
