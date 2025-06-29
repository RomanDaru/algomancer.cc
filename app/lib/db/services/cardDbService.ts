import { Card } from "../../types/card";
import { connectToDatabase } from "../mongodb";
import {
  CardModel,
  convertCardToDocument,
  convertDocumentToCard,
} from "../models/Card";

// Single database connection instance
let dbConnection: any = null;

/**
 * Ensure database connection is established
 * Reuses existing connection if available
 */
async function ensureDbConnection() {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  return dbConnection;
}

/**
 * Service for interacting with the card database
 * Optimized to use a single database connection
 */
export const cardDbService = {
  /**
   * Get all cards from the database
   */
  async getAllCards(): Promise<Card[]> {
    try {
      await ensureDbConnection();
      const cardDocs = await CardModel.find().sort({ currentIndex: 1 });
      return cardDocs.map(convertDocumentToCard);
    } catch (error) {
      console.error("Error getting all cards:", error);
      throw error;
    }
  },

  /**
   * Get a card by ID
   */
  async getCardById(id: string): Promise<Card | null> {
    try {
      await ensureDbConnection();
      const cardDoc = await CardModel.findOne({ originalId: id });
      return cardDoc ? convertDocumentToCard(cardDoc) : null;
    } catch (error) {
      console.error(`Error getting card with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get multiple cards by IDs (batch loading)
   */
  async getCardsByIds(ids: string[]): Promise<Card[]> {
    try {
      if (ids.length === 0) return [];

      await ensureDbConnection();
      const cardDocs = await CardModel.find({
        originalId: { $in: ids },
      }).sort({ currentIndex: 1 });

      return cardDocs.map(convertDocumentToCard);
    } catch (error) {
      console.error(`Error getting cards by IDs ${ids.join(", ")}:`, error);
      throw error;
    }
  },

  /**
   * Create a new card
   */
  async createCard(card: Card): Promise<Card> {
    try {
      await ensureDbConnection();
      const cardDoc = new CardModel(convertCardToDocument(card));
      await cardDoc.save();
      return convertDocumentToCard(cardDoc);
    } catch (error) {
      console.error("Error creating card:", error);
      throw error;
    }
  },

  /**
   * Update an existing card
   */
  async updateCard(card: Card): Promise<Card | null> {
    try {
      await ensureDbConnection();
      const cardDoc = await CardModel.findOneAndUpdate(
        { originalId: card.id },
        convertCardToDocument(card),
        { new: true }
      );
      return cardDoc ? convertDocumentToCard(cardDoc) : null;
    } catch (error) {
      console.error(`Error updating card with ID ${card.id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a card by ID
   * This method requires explicit confirmation to prevent accidental deletions
   */
  async deleteCard(
    id: string,
    confirmDelete: boolean = false
  ): Promise<boolean> {
    try {
      if (!confirmDelete) {
        console.warn(
          `Attempted to delete card ${id} without confirmation. Operation aborted.`
        );
        throw new Error(
          "Delete operation requires explicit confirmation. Set confirmDelete=true to proceed."
        );
      }

      // Create a backup before deletion
      const card = await this.getCardById(id);
      if (card) {
        // Log the card being deleted for recovery if needed
        console.log(`Deleting card: ${JSON.stringify(card)}`);

        // Proceed with deletion
        await ensureDbConnection();
        const result = await CardModel.deleteOne({ originalId: id });
        return result.deletedCount === 1;
      } else {
        throw new Error(`Card with ID ${id} not found`);
      }
    } catch (error) {
      console.error(`Error deleting card with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Save or update a card (upsert)
   */
  async saveCard(card: Card): Promise<Card> {
    try {
      await ensureDbConnection();
      const existingCard = await CardModel.findOne({ originalId: card.id });

      if (existingCard) {
        // Update existing card
        const updatedCardDoc = await CardModel.findOneAndUpdate(
          { originalId: card.id },
          convertCardToDocument(card),
          { new: true }
        );
        return convertDocumentToCard(updatedCardDoc!);
      } else {
        // Create new card
        const cardDoc = new CardModel(convertCardToDocument(card));
        await cardDoc.save();
        return convertDocumentToCard(cardDoc);
      }
    } catch (error) {
      console.error(`Error saving card with ID ${card.id}:`, error);
      throw error;
    }
  },

  /**
   * Get the highest current index
   */
  async getHighestIndex(): Promise<number> {
    try {
      await ensureDbConnection();
      const highestCard = await CardModel.findOne().sort({ currentIndex: -1 });
      return highestCard?.currentIndex || 0;
    } catch (error) {
      console.error("Error getting highest index:", error);
      throw error;
    }
  },

  /**
   * Import cards from an array (bulk operation)
   */
  async importCards(cards: Card[]): Promise<number> {
    try {
      await ensureDbConnection();

      // Convert cards to documents
      const cardDocuments = cards.map(convertCardToDocument);

      // Use bulkWrite for better performance
      const operations = cardDocuments.map((doc) => ({
        updateOne: {
          filter: { originalId: doc.originalId },
          update: doc,
          upsert: true,
        },
      }));

      const result = await CardModel.bulkWrite(operations);
      return result.upsertedCount + result.modifiedCount;
    } catch (error) {
      console.error("Error importing cards:", error);
      throw error;
    }
  },
};
