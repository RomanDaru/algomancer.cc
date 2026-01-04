import { Card } from "../types/card";
import { cardDbService } from "../db/services/cardDbService";

// Cache for cards to avoid excessive database calls
let cachedCards: Card[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache TTL

// Get the active card set
const getActiveCards = async (): Promise<Card[]> => {
  const now = Date.now();

  // Use cache if available and not expired
  if (cachedCards && now - lastCacheTime < CACHE_TTL) {
    return cachedCards;
  }

  try {
    // Fetch cards from database
    const cards = await cardDbService.getAllCards();

    // Update cache
    cachedCards = cards;
    lastCacheTime = now;

    return cards;
  } catch (error) {
    console.error("Error fetching cards from database:", error);

    // Return empty array if there's an error
    return [];
  }
};

export const cardService = {
  // Get all cards
  getAllCards: async (): Promise<Card[]> => {
    return await getActiveCards();
  },

  // Get card by ID
  getCardById: async (id: string): Promise<Card | undefined> => {
    try {
      // Try to get directly from the database first for freshest data
      const card = await cardDbService.getCardById(id);
      if (card) return card;

      // Fall back to cached cards if not found
      const cards = await getActiveCards();
      return cards.find((card) => card.id === id);
    } catch (error) {
      console.error(`Error getting card by ID ${id}:`, error);
      return undefined;
    }
  },

  // Get multiple cards by IDs (batch loading)
  getCardsByIds: async (ids: string[]): Promise<Card[]> => {
    try {
      if (ids.length === 0) return [];

      const now = Date.now();

      // Use cached cards if available and fresh.
      if (cachedCards && now - lastCacheTime < CACHE_TTL) {
        return ids
          .map((id) => cachedCards!.find((card) => card.id === id))
          .filter((card) => card !== undefined) as Card[];
      }

      return await cardDbService.getCardsByIds(ids);
    } catch (error) {
      console.error(`Error getting cards by IDs ${ids.join(", ")}:`, error);
      return [];
    }
  },

  // Search cards by name
  searchCardsByName: async (query: string): Promise<Card[]> => {
    const lowercaseQuery = query.toLowerCase();
    const cards = await getActiveCards();
    return cards.filter((card: Card) =>
      card.name.toLowerCase().includes(lowercaseQuery)
    );
  },

  // Filter cards by element
  filterCardsByElement: async (element: string): Promise<Card[]> => {
    const cards = await getActiveCards();
    return cards.filter(
      (card: Card) => card.element.type.toLowerCase() === element.toLowerCase()
    );
  },

  // Filter cards by type
  filterCardsByType: async (type: string): Promise<Card[]> => {
    const cards = await getActiveCards();
    return cards.filter(
      (card: Card) =>
        card.typeAndAttributes.mainType.toLowerCase() === type.toLowerCase()
    );
  },

  // Save a card
  saveCard: async (card: Card): Promise<Card> => {
    try {
      // Clear cache to ensure fresh data
      cachedCards = null;

      // Save to database
      return await cardDbService.saveCard(card);
    } catch (error) {
      console.error(`Error saving card ${card.id}:`, error);
      throw error;
    }
  },

  // Import cards in bulk
  importCards: async (cards: Card[]): Promise<number> => {
    try {
      // Clear cache to ensure fresh data
      cachedCards = null;

      // Import to database
      return await cardDbService.importCards(cards);
    } catch (error) {
      console.error("Error importing cards:", error);
      throw error;
    }
  },

  // Get the highest card index
  getHighestIndex: async (): Promise<number> => {
    try {
      return await cardDbService.getHighestIndex();
    } catch (error) {
      console.error("Error getting highest card index:", error);
      return 0;
    }
  },

  // Clear the card cache
  clearCache: (): void => {
    cachedCards = null;
    lastCacheTime = 0;
  },
};
