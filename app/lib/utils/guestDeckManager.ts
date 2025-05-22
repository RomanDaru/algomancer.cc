import { DeckCard } from "@/app/lib/types/user";

export interface GuestDeck {
  id: string;
  name: string;
  description: string;
  cards: DeckCard[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const GUEST_DECK_KEY = "algomancer_guest_deck";

export class GuestDeckManager {
  /**
   * Generate a unique ID for guest decks
   */
  private static generateId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Save a guest deck to localStorage
   */
  static saveGuestDeck(
    deckData: Omit<GuestDeck, "id" | "createdAt" | "updatedAt">
  ): GuestDeck {
    if (typeof window === "undefined") {
      throw new Error("localStorage is not available on server side");
    }

    const existingDeck = this.loadGuestDeck();
    const now = new Date().toISOString();

    const guestDeck: GuestDeck = {
      id: existingDeck?.id || this.generateId(),
      name: deckData.name,
      description: deckData.description,
      cards: deckData.cards,
      isPublic: deckData.isPublic,
      createdAt: existingDeck?.createdAt || now,
      updatedAt: now,
    };

    try {
      localStorage.setItem(GUEST_DECK_KEY, JSON.stringify(guestDeck));
      return guestDeck;
    } catch (error) {
      console.error("Failed to save guest deck to localStorage:", error);
      throw new Error(
        "Failed to save deck. Your browser storage might be full."
      );
    }
  }

  /**
   * Load the guest deck from localStorage
   */
  static loadGuestDeck(): GuestDeck | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem(GUEST_DECK_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      // Validate the structure
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.cards)) {
        console.warn("Invalid guest deck structure found, clearing...");
        this.clearGuestDeck();
        return null;
      }

      return parsed as GuestDeck;
    } catch (error) {
      console.error("Failed to load guest deck from localStorage:", error);
      this.clearGuestDeck(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear the guest deck from localStorage
   */
  static clearGuestDeck(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.removeItem(GUEST_DECK_KEY);
    } catch (error) {
      console.error("Failed to clear guest deck from localStorage:", error);
    }
  }

  /**
   * Check if a guest deck exists
   */
  static hasGuestDeck(): boolean {
    return this.loadGuestDeck() !== null;
  }

  /**
   * Update specific fields of the guest deck
   */
  static updateGuestDeck(
    updates: Partial<Omit<GuestDeck, "id" | "createdAt">>
  ): GuestDeck | null {
    const existingDeck = this.loadGuestDeck();
    if (!existingDeck) {
      return null;
    }

    const updatedDeck = {
      ...existingDeck,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.saveGuestDeck(updatedDeck);
  }

  /**
   * Convert guest deck to format suitable for API submission
   */
  static prepareForApiSubmission(guestDeck: GuestDeck): {
    name: string;
    description: string;
    cards: DeckCard[];
    isPublic: boolean;
  } {
    return {
      name: guestDeck.name,
      description: guestDeck.description,
      cards: guestDeck.cards,
      isPublic: guestDeck.isPublic,
    };
  }

  /**
   * Get deck statistics for guest deck
   */
  static getGuestDeckStats(): {
    totalCards: number;
    lastUpdated: string | null;
    deckName: string | null;
  } {
    const deck = this.loadGuestDeck();
    if (!deck) {
      return {
        totalCards: 0,
        lastUpdated: null,
        deckName: null,
      };
    }

    const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);

    return {
      totalCards,
      lastUpdated: deck.updatedAt,
      deckName: deck.name,
    };
  }
}
