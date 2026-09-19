import { Card } from "../types/card";
import { cardDbService } from "../db/services/cardDbService";
import { revalidateTag, unstable_cache } from "next/cache";

export const CARD_CATALOG_CACHE_TAG = "card-catalog";
const CARD_CATALOG_REVALIDATE_SECONDS = 60 * 60;

const getCachedCardCatalog = unstable_cache(
  async () => cardDbService.getAllCards(),
  [CARD_CATALOG_CACHE_TAG],
  {
    revalidate: CARD_CATALOG_REVALIDATE_SECONDS,
    tags: [CARD_CATALOG_CACHE_TAG],
  }
);

// Get the active card set
const getActiveCards = async (): Promise<Card[]> => {
  try {
    return await getCachedCardCatalog();
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
      const cards = await getActiveCards();
      const cardMap = new Map(cards.map((card) => [card.id, card]));
      return ids
        .map((id) => cardMap.get(id))
        .filter((card): card is Card => card !== undefined);
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
      const savedCard = await cardDbService.saveCard(card);
      revalidateTag(CARD_CATALOG_CACHE_TAG);
      return savedCard;
    } catch (error) {
      console.error(`Error saving card ${card.id}:`, error);
      throw error;
    }
  },

  // Import cards in bulk
  importCards: async (cards: Card[]): Promise<number> => {
    try {
      const importedCount = await cardDbService.importCards(cards);
      revalidateTag(CARD_CATALOG_CACHE_TAG);
      return importedCount;
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
    revalidateTag(CARD_CATALOG_CACHE_TAG);
  },
};
