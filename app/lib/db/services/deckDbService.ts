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
      }).sort({ createdAt: -1 });
      return deckDocs.map(convertDocumentToDeck);
    } catch (error) {
      console.error(`Error getting decks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Get public decks with user information
   * @param sortBy Optional parameter to sort by 'popular' (views) or 'newest' (default)
   */
  async getPublicDecks(
    sortBy: "popular" | "newest" = "newest"
  ): Promise<Deck[]> {
    try {
      await connectToDatabase();

      // Sort by the specified field
      const sortOptions =
        sortBy === "popular"
          ? { views: -1 } // Sort by views (descending)
          : { createdAt: -1 }; // Sort by createdAt (descending)

      const deckDocs = await DeckModel.find({ isPublic: true }).sort(
        sortOptions
      );
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

  /**
   * Get decks containing a specific card
   */
  async getDecksContainingCard(
    cardId: string,
    limit?: number
  ): Promise<Deck[]> {
    try {
      await connectToDatabase();

      // Find decks that contain the card and are public
      let query = DeckModel.find({
        "cards.cardId": cardId,
        isPublic: true,
      }).sort({ createdAt: -1 });

      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }

      const deckDocs = await query;
      return deckDocs.map(convertDocumentToDeck);
    } catch (error) {
      console.error(`Error getting decks containing card ${cardId}:`, error);
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
      await connectToDatabase();
      const db = mongoose.connection.db;
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
   * Toggle like status for a deck
   */
  async toggleDeckLike(
    deckId: string,
    userId: ObjectId
  ): Promise<{ liked: boolean; likes: number } | null> {
    try {
      await connectToDatabase();

      // First, check if the deck exists
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Check if user has already liked the deck
      const userIdString = userId.toString();
      const alreadyLiked = deck.likedBy.some(
        (id) => id.toString() === userIdString
      );

      let updateOperation;
      let newLikeCount;

      if (alreadyLiked) {
        // Unlike: remove user from likedBy array and decrement likes
        updateOperation = {
          $pull: { likedBy: userId },
          $inc: { likes: -1 },
        };
        newLikeCount = Math.max(0, (deck.likes || 0) - 1);
      } else {
        // Like: add user to likedBy array and increment likes
        updateOperation = {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        };
        newLikeCount = (deck.likes || 0) + 1;
      }

      // Update the deck
      await DeckModel.findByIdAndUpdate(new ObjectId(deckId), updateOperation, {
        new: true,
      });

      return {
        liked: !alreadyLiked,
        likes: newLikeCount,
      };
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
      await connectToDatabase();
      const deckDocs = await DeckModel.find({
        likedBy: new ObjectId(userId),
        isPublic: true, // Only return public decks
      }).sort({ updatedAt: -1 });
      return deckDocs.map(convertDocumentToDeck);
    } catch (error) {
      console.error(`Error getting liked decks for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Increment the view count for a deck
   * Uses the viewerId to prevent duplicate views from the same user/session
   */
  async incrementDeckViews(
    deckId: string,
    viewerId: string
  ): Promise<Deck | null> {
    try {
      // Connect to the database and get the db instance
      const { db } = await connectToDatabase();

      // First, check if the deck exists and get its current state
      const currentDeck = await db
        .collection("decks")
        .findOne({ _id: new ObjectId(deckId) });

      if (!currentDeck) {
        return null;
      }

      // Check if this viewer has already viewed the deck
      const alreadyViewed =
        currentDeck.viewedBy && currentDeck.viewedBy.includes(viewerId);

      if (!alreadyViewed) {
        // Check if the views field exists
        if (currentDeck.views === undefined) {
          // If views doesn't exist, set it to 1
          await db.collection("decks").updateOne(
            { _id: new ObjectId(deckId) },
            {
              $set: { views: 1 },
              $push: { viewedBy: viewerId },
              // Preserve the original updatedAt timestamp
              $setOnInsert: { updatedAt: currentDeck.updatedAt },
            },
            { timestamps: false } // Prevent automatic updatedAt update
          );
        } else {
          // If views exists, increment it
          await db.collection("decks").updateOne(
            { _id: new ObjectId(deckId) },
            {
              $inc: { views: 1 },
              $push: { viewedBy: viewerId },
              // Preserve the original updatedAt timestamp
              $setOnInsert: { updatedAt: currentDeck.updatedAt },
            },
            { timestamps: false } // Prevent automatic updatedAt update
          );
        }
      }

      // Fetch the updated deck
      const updatedDeck = await db
        .collection("decks")
        .findOne({ _id: new ObjectId(deckId) });

      if (!updatedDeck) {
        return null;
      }

      // Convert the MongoDB document to our Deck type
      return {
        _id: updatedDeck._id,
        name: updatedDeck.name,
        description: updatedDeck.description,
        userId: updatedDeck.userId,
        cards: updatedDeck.cards || [],
        createdAt: updatedDeck.createdAt,
        updatedAt: updatedDeck.updatedAt,
        isPublic: updatedDeck.isPublic,
        views: updatedDeck.views || 0,
        viewedBy: updatedDeck.viewedBy || [],
      };
    } catch (error) {
      console.error(`Error incrementing view count for deck ${deckId}:`, error);
      throw error;
    }
  },
};
