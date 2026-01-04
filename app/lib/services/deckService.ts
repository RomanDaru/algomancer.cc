import { Deck, DeckCard } from "../types/user";
import { deckDbService } from "../db/services/deckDbService";
import { cardService } from "./cardService";
import { Card } from "../types/card";
import { getAllDeckElements } from "../utils/elements";

// Cache for decks
let cachedUserDecks: Record<string, { decks: Deck[]; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

async function addDeckElementsToDecks(decks: Deck[]): Promise<Deck[]> {
  if (decks.length === 0) {
    return decks;
  }

  const uniqueCardIds = new Set<string>();
  for (const deck of decks) {
    for (const deckCard of deck.cards || []) {
      if (deckCard.cardId) {
        uniqueCardIds.add(deckCard.cardId);
      }
    }
  }

  if (uniqueCardIds.size === 0) {
    return decks.map((deck) => ({
      ...deck,
      deckElements:
        deck.deckElements && deck.deckElements.length > 0
          ? deck.deckElements
          : ["Colorless"],
      totalCards:
        typeof deck.totalCards === "number"
          ? deck.totalCards
          : deck.cards.reduce((sum, card) => sum + card.quantity, 0),
    }));
  }

  const cards = await cardService.getCardsByIds([...uniqueCardIds]);
  const cardMap = new Map(cards.map((card) => [card.id, card]));

  return decks.map((deck) => {
    const cardsWithQuantities = (deck.cards || [])
      .map((deckCard) => {
        const card = cardMap.get(deckCard.cardId);
        if (!card) return null;
        return { card, quantity: deckCard.quantity };
      })
      .filter(Boolean) as { card: Card; quantity: number }[];

    const deckElements =
      cardsWithQuantities.length > 0
        ? getAllDeckElements(cardsWithQuantities)
        : ["Colorless"];
    const totalCards =
      typeof deck.totalCards === "number"
        ? deck.totalCards
        : deck.cards.reduce((sum, card) => sum + card.quantity, 0);

    return {
      ...deck,
      deckElements,
      totalCards,
    };
  });
}

/**
 * Service for deck operations
 */
export const deckService = {
  /**
   * Get all decks for a user
   */
  async getUserDecks(userId: string): Promise<Deck[]> {
    const now = Date.now();

    // Use cache if available and not expired
    if (
      cachedUserDecks[userId] &&
      now - cachedUserDecks[userId].timestamp < CACHE_TTL
    ) {
      return cachedUserDecks[userId].decks;
    }

    try {
      const decks = await deckDbService.getUserDecks(userId);
      const decksWithElements = await addDeckElementsToDecks(decks);

      // Update cache
      cachedUserDecks[userId] = {
        decks: decksWithElements,
        timestamp: now,
      };

      return decksWithElements;
    } catch (error) {
      console.error(`Error getting decks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get public decks
   * @param sortBy Optional parameter to sort by 'popular' (views), 'liked' (likes), or 'newest' (default)
   */
  async getPublicDecks(
    sortBy: "popular" | "newest" | "liked" = "newest"
  ): Promise<Deck[]> {
    try {
      return await deckDbService.getPublicDecks(sortBy);
    } catch (error) {
      console.error("Error getting public decks:", error);
      throw error;
    }
  },

  /**
   * Get a deck by ID
   */
  async getDeckById(id: string): Promise<Deck | null> {
    try {
      return await deckDbService.getDeckById(id);
    } catch (error) {
      console.error(`Error getting deck with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new deck
   */
  async createDeck(deck: Partial<Deck>): Promise<Deck> {
    try {
      const newDeck = await deckDbService.createDeck(deck);

      // Clear cache for this user
      if (cachedUserDecks[newDeck.userId.toString()]) {
        delete cachedUserDecks[newDeck.userId.toString()];
      }

      return newDeck;
    } catch (error) {
      console.error("Error creating deck:", error);
      throw error;
    }
  },

  /**
   * Update an existing deck
   */
  async updateDeck(id: string, deck: Partial<Deck>): Promise<Deck | null> {
    try {
      const updatedDeck = await deckDbService.updateDeck(id, deck);

      // Clear cache for this user
      if (updatedDeck && cachedUserDecks[updatedDeck.userId.toString()]) {
        delete cachedUserDecks[updatedDeck.userId.toString()];
      }

      return updatedDeck;
    } catch (error) {
      console.error(`Error updating deck with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a deck
   */
  async deleteDeck(id: string, userId: string): Promise<boolean> {
    try {
      const success = await deckDbService.deleteDeck(id);

      // Clear cache for this user
      if (success && cachedUserDecks[userId]) {
        delete cachedUserDecks[userId];
      }

      return success;
    } catch (error) {
      console.error(`Error deleting deck with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get full card details for a deck
   */
  async getDeckWithCards(deckId: string): Promise<{
    deck: Deck | null;
    cards: Card[];
    user?: { name: string; username: string | null };
  }> {
    try {
      const deck = await deckDbService.getDeckById(deckId);

      if (!deck) {
        return { deck: null, cards: [] };
      }

      const cardIds = Array.from(
        new Set(deck.cards.map((deckCard) => deckCard.cardId))
      );
      const cards = await cardService.getCardsByIds(cardIds);

      // Get user information
      const user = await deckDbService.getDeckUserInfo(deck.userId.toString());

      return { deck, cards, user };
    } catch (error) {
      console.error(`Error getting cards for deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Get public decks with user information
   * @param sortBy Optional parameter to sort by 'popular' (views), 'liked' (likes), or 'newest' (default)
   * @param limit Optional limit for pagination
   * @param skip Optional skip for pagination
   * @param currentUserId Optional current user ID to include like status for each deck
   */
  async getPublicDecksWithUserInfo(
    sortBy: "popular" | "newest" | "liked" = "newest",
    limit?: number,
    skip?: number,
    currentUserId?: string
  ): Promise<
    {
      deck: Deck;
      user: { name: string; username: string | null };
      isLikedByCurrentUser: boolean;
      deckElements: string[];
    }[]
  > {
    try {
      // Use the optimized aggregation method from deckDbService
      const results = await deckDbService.getPublicDecksWithUserInfo(
        sortBy,
        limit,
        skip,
        currentUserId
      );

      if (results.length === 0) {
        return results;
      }

      const uniqueCardIds = new Set<string>();
      for (const item of results) {
        for (const deckCard of item.deck.cards || []) {
          uniqueCardIds.add(deckCard.cardId);
        }
      }

      if (uniqueCardIds.size === 0) {
        return results.map((item) => ({
          ...item,
          deckElements: item.deckElements?.length ? item.deckElements : ["Colorless"],
        }));
      }

      const cards = await cardService.getCardsByIds([...uniqueCardIds]);
      const cardMap = new Map(cards.map((card) => [card.id, card]));

      return results.map((item) => {
        const cardsWithQuantities = (item.deck.cards || [])
          .map((deckCard) => {
            const card = cardMap.get(deckCard.cardId);
            if (!card) return null;
            return { card, quantity: deckCard.quantity };
          })
          .filter(Boolean) as { card: Card; quantity: number }[];

        const deckElements =
          cardsWithQuantities.length > 0
            ? getAllDeckElements(cardsWithQuantities)
            : ["Colorless"];

        return {
          ...item,
          deckElements,
        };
      });
    } catch (error) {
      console.error("Error getting public decks with user info:", error);
      throw error;
    }
  },

  /**
   * Add a card to a deck
   */
  async addCardToDeck(
    deckId: string,
    cardId: string,
    quantity: number = 1
  ): Promise<Deck | null> {
    try {
      const updatedDeck = await deckDbService.addCardToDeck(
        deckId,
        cardId,
        quantity
      );

      // Clear cache for this user
      if (updatedDeck && cachedUserDecks[updatedDeck.userId.toString()]) {
        delete cachedUserDecks[updatedDeck.userId.toString()];
      }

      return updatedDeck;
    } catch (error) {
      console.error(`Error adding card ${cardId} to deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a card from a deck
   */
  async removeCardFromDeck(
    deckId: string,
    cardId: string,
    quantity: number = 1
  ): Promise<Deck | null> {
    try {
      const updatedDeck = await deckDbService.removeCardFromDeck(
        deckId,
        cardId,
        quantity
      );

      // Clear cache for this user
      if (updatedDeck && cachedUserDecks[updatedDeck.userId.toString()]) {
        delete cachedUserDecks[updatedDeck.userId.toString()];
      }

      return updatedDeck;
    } catch (error) {
      console.error(
        `Error removing card ${cardId} from deck ${deckId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Update cards in a deck
   */
  async updateDeckCards(
    deckId: string,
    cards: DeckCard[]
  ): Promise<Deck | null> {
    try {
      const updatedDeck = await deckDbService.updateDeckCards(deckId, cards);

      // Clear cache for this user
      if (updatedDeck && cachedUserDecks[updatedDeck.userId.toString()]) {
        delete cachedUserDecks[updatedDeck.userId.toString()];
      }

      return updatedDeck;
    } catch (error) {
      console.error(`Error updating cards in deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Get decks containing a specific card with user information and card data
   * Optimized version using batch queries to eliminate N+1 problem
   */
  async getDecksContainingCardWithUserInfo(
    cardId: string,
    limit?: number
  ): Promise<
    {
      deck: Deck;
      user: { name: string; username: string | null };
      cards: Card[];
    }[]
  > {
    try {
      // Use the optimized aggregation method from deckDbService
      return await deckDbService.getDecksContainingCardWithUserInfoOptimized(
        cardId,
        limit
      );
    } catch (error) {
      console.error(`Error getting decks containing card ${cardId}:`, error);
      throw error;
    }
  },

  /**
   * Increment the view count for a deck
   */
  async incrementDeckViews(
    deckId: string,
    viewerId: string
  ): Promise<Deck | null> {
    try {
      return await deckDbService.incrementDeckViews(deckId, viewerId);
    } catch (error) {
      console.error(`Error incrementing view count for deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Toggle like status for a deck
   */
  async toggleDeckLike(
    deckId: string,
    userId: ObjectId
  ): Promise<{ liked: boolean; likes: number } | null> {
    try {
      return await deckDbService.toggleDeckLike(deckId, userId);
    } catch (error) {
      console.error(`Error toggling like for deck ${deckId}:`, error);
      throw error;
    }
  },

  /**
   * Get decks liked by a user
   */
  async getUserLikedDecks(userId: string): Promise<Deck[]> {
    try {
      return await deckDbService.getUserLikedDecks(userId);
    } catch (error) {
      console.error(`Error getting liked decks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get liked decks with user information
   */
  async getUserLikedDecksWithUserInfo(
    userId: string
  ): Promise<
    Array<{
      deck: Deck;
      user: { name: string; username: string | null };
      isLikedByCurrentUser: boolean;
      deckElements: string[];
    }>
  > {
    try {
      const likedDecks = await this.getUserLikedDecks(userId);
      const likedDecksWithElements = await addDeckElementsToDecks(likedDecks);

      // Get user information for each deck
      const decksWithUserInfo = await Promise.all(
        likedDecksWithElements.map(async (deck) => {
          const user = await deckDbService.getDeckUserInfo(
            deck.userId.toString()
          );
          return {
            deck,
            user,
            isLikedByCurrentUser: true,
            deckElements: deck.deckElements || [],
          };
        })
      );

      return decksWithUserInfo;
    } catch (error) {
      console.error(
        `Error getting liked decks with user info for user ${userId}:`,
        error
      );
      throw error;
    }
  },
};
