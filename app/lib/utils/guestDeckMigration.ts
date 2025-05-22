import { GuestDeckManager, GuestDeck } from './guestDeckManager';
import { toast } from 'react-hot-toast';

export interface MigrationResult {
  success: boolean;
  deckId?: string;
  error?: string;
}

export class GuestDeckMigration {
  /**
   * Check if there's a guest deck that can be migrated
   */
  static hasGuestDeckToMigrate(): boolean {
    return GuestDeckManager.hasGuestDeck();
  }

  /**
   * Get guest deck information for migration prompt
   */
  static getGuestDeckInfo(): {
    deckName: string;
    totalCards: number;
    lastUpdated: string;
  } | null {
    const guestDeck = GuestDeckManager.loadGuestDeck();
    if (!guestDeck) {
      return null;
    }

    const totalCards = guestDeck.cards.reduce((sum, card) => sum + card.quantity, 0);

    return {
      deckName: guestDeck.name,
      totalCards,
      lastUpdated: guestDeck.updatedAt,
    };
  }

  /**
   * Migrate guest deck to authenticated user account
   */
  static async migrateGuestDeck(): Promise<MigrationResult> {
    try {
      const guestDeck = GuestDeckManager.loadGuestDeck();
      if (!guestDeck) {
        return {
          success: false,
          error: 'No guest deck found to migrate',
        };
      }

      // Prepare deck data for API submission
      const deckData = GuestDeckManager.prepareForApiSubmission(guestDeck);

      // Create the deck via API
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deckData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save deck');
      }

      const savedDeck = await response.json();

      // Clear the guest deck after successful migration
      GuestDeckManager.clearGuestDeck();

      return {
        success: true,
        deckId: savedDeck._id,
      };
    } catch (error) {
      console.error('Error migrating guest deck:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to migrate deck',
      };
    }
  }

  /**
   * Show migration prompt and handle user choice
   */
  static async promptAndMigrate(): Promise<MigrationResult | null> {
    const guestDeckInfo = this.getGuestDeckInfo();
    if (!guestDeckInfo) {
      return null;
    }

    // For now, we'll auto-migrate. In the future, you could add a confirmation dialog
    const result = await this.migrateGuestDeck();

    if (result.success) {
      toast.success(`Successfully saved "${guestDeckInfo.deckName}" to your account!`);
    } else {
      toast.error(result.error || 'Failed to save your guest deck');
    }

    return result;
  }

  /**
   * Discard guest deck without migrating
   */
  static discardGuestDeck(): void {
    GuestDeckManager.clearGuestDeck();
    toast.success('Guest deck cleared');
  }

  /**
   * Create a migration banner component data
   */
  static getMigrationBannerData(): {
    show: boolean;
    deckName: string;
    totalCards: number;
    onMigrate: () => Promise<MigrationResult | null>;
    onDiscard: () => void;
  } {
    const guestDeckInfo = this.getGuestDeckInfo();
    
    return {
      show: !!guestDeckInfo,
      deckName: guestDeckInfo?.deckName || '',
      totalCards: guestDeckInfo?.totalCards || 0,
      onMigrate: () => this.promptAndMigrate(),
      onDiscard: () => this.discardGuestDeck(),
    };
  }
}
