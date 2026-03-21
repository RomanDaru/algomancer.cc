import { Deck } from "./user";

export type DeckSortBy = "popular" | "newest" | "liked";

export interface DeckWithUserInfo {
  deck: Deck;
  user: { name: string; username: string | null; achievementXp?: number };
  isLikedByCurrentUser?: boolean;
  deckElements?: string[];
}

export interface DeckBrowseFilters {
  searchQuery?: string;
  elements?: string[];
  badges?: string[];
}

export interface DecodedDeckCursor {
  sortBy: DeckSortBy;
  sortValue: number;
  id: string;
}

export interface PaginatedDeckResponse {
  decks: DeckWithUserInfo[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
  effectiveLimit: number;
  requestedLimit?: number;
  warnings: string[];
}
