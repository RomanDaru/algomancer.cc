import { Deck, DeckCard } from "../../types/user";
import { connectToDatabase } from "../mongodb";
import mongoose from "../mongodb";
import {
  DeckModel,
  convertDeckToDocument,
  convertDocumentToDeck,
} from "../models/Deck";
import { ObjectId } from "mongodb";

/**
 * Service for interacting with the deck database
 */
export const deckDbService = {
  /**
   * Get all decks for a user
   */
  async getUserDecks(userId: string): Promise<Deck[]> {
    try {
      await connectToDatabase();
      const deckDocs = await DeckModel.find({
        userId: new ObjectId(userId),
      }).sort({ updatedAt: -1 });
      return deckDocs.map(convertDocumentToDeck);
    } catch (error) {
      console.error(`Error getting decks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get public decks with user information
   */
  async getPublicDecks(): Promise<Deck[]> {
    try {
      await connectToDatabase();
      const deckDocs = await DeckModel.find({ isPublic: true }).sort({
        updatedAt: -1,
      });
      return deckDocs.map(convertDocumentToDeck);
    } catch (error) {
      console.error("Error getting public decks:", error);
      throw error;
    }
  },

  /**
   * Get user information for a deck
   */
  async getDeckUserInfo(
    userId: string
  ): Promise<{ name: string; username: string | null }> {
    try {
      const connection = await connectToDatabase();
      if (!connection || !connection.db) {
        console.error("Failed to get database connection");
        return { name: "Unknown User", username: null };
      }

      const db = connection.db;
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return { name: "Unknown User", username: null };
      }

      return {
        name: user.name || "Unknown User",
        username: user.username || null,
      };
    } catch (error) {
      console.error(`Error getting user info for user ${userId}:`, error);
      return { name: "Unknown User", username: null };
    }
  },

  /**
   * Get a deck by ID
   */
  async getDeckById(id: string): Promise<Deck | null> {
    try {
      await connectToDatabase();
      const deckDoc = await DeckModel.findById(new ObjectId(id));
      return deckDoc ? convertDocumentToDeck(deckDoc) : null;
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
      await connectToDatabase();
      const deckDoc = new DeckModel(convertDeckToDocument(deck));
      await deckDoc.save();
      return convertDocumentToDeck(deckDoc);
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
      await connectToDatabase();
      const deckDoc = await DeckModel.findByIdAndUpdate(
        new ObjectId(id),
        { $set: convertDeckToDocument(deck) },
        { new: true }
      );
      return deckDoc ? convertDocumentToDeck(deckDoc) : null;
    } catch (error) {
      console.error(`Error updating deck with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a deck
   */
  async deleteDeck(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const result = await DeckModel.findByIdAndDelete(new ObjectId(id));
      return !!result;
    } catch (error) {
      console.error(`Error deleting deck with ID ${id}:`, error);
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
      await connectToDatabase();

      // Find the deck
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Check if the card already exists in the deck
      const existingCardIndex = deck.cards.findIndex(
        (c) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Update the quantity of the existing card
        deck.cards[existingCardIndex].quantity += quantity;
      } else {
        // Add the new card to the deck
        deck.cards.push({ cardId, quantity });
      }

      // Save the updated deck
      await deck.save();

      return convertDocumentToDeck(deck);
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
      await connectToDatabase();

      // Find the deck
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Find the card in the deck
      const existingCardIndex = deck.cards.findIndex(
        (c) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Decrease the quantity of the card
        deck.cards[existingCardIndex].quantity -= quantity;

        // If the quantity is 0 or less, remove the card from the deck
        if (deck.cards[existingCardIndex].quantity <= 0) {
          deck.cards.splice(existingCardIndex, 1);
        }

        // Save the updated deck
        await deck.save();
      }

      return convertDocumentToDeck(deck);
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
      await connectToDatabase();

      const deckDoc = await DeckModel.findByIdAndUpdate(
        new ObjectId(deckId),
        { $set: { cards } },
        { new: true }
      );

      return deckDoc ? convertDocumentToDeck(deckDoc) : null;
    } catch (error) {
      console.error(`Error updating cards in deck ${deckId}:`, error);
      throw error;
    }
  },
};
