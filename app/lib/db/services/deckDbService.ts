import { Deck, DeckCard } from "../../types/user";
import { Card } from "../../types/card";
import { connectToDatabase } from "../mongodb";
import {
  DeckModel,
  convertDeckToDocument,
  convertDocumentToDeck,
  convertAggregationToDeck,
} from "../models/Deck";
import { ObjectId } from "mongodb";

// Single database connection instance
let dbConnection: any = null;
const BASIC_ELEMENTS = ["Fire", "Water", "Earth", "Wood", "Metal"];

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

async function computeDeckSummary(cards: DeckCard[]): Promise<{
  deckElements: string[];
  totalCards: number;
}> {
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);

  if (!cards || cards.length === 0) {
    return { deckElements: ["Colorless"], totalCards };
  }

  const uniqueCardIds = Array.from(
    new Set(cards.map((card) => card.cardId).filter(Boolean))
  );

  if (uniqueCardIds.length === 0) {
    return { deckElements: ["Colorless"], totalCards };
  }

  const connection = await ensureDbConnection();
  if (!connection || !connection.db) {
    return { deckElements: ["Colorless"], totalCards };
  }

  const cardDocs = await connection.db
    .collection("cards")
    .find(
      { originalId: { $in: uniqueCardIds } },
      { projection: { originalId: 1, "element.type": 1 } }
    )
    .toArray();

  const elementSet = new Set<string>();
  for (const card of cardDocs) {
    const elementType = card?.element?.type;
    if (typeof elementType !== "string") continue;

    const parts = elementType.includes("/")
      ? elementType.split("/")
      : [elementType];

    for (const part of parts) {
      const trimmed = part.trim();
      if (BASIC_ELEMENTS.includes(trimmed)) {
        elementSet.add(trimmed);
      }
    }
  }

  const deckElements =
    elementSet.size > 0
      ? BASIC_ELEMENTS.filter((element) => elementSet.has(element))
      : ["Colorless"];

  return { deckElements, totalCards };
}

/**
 * Service for interacting with the deck database
 * Optimized to use a single database connection
 */
export const deckDbService = {
  /**
   * Get all decks for a user
   */
  async getUserDecks(userId: string): Promise<Deck[]> {
    try {
      await ensureDbConnection();
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
   * @param sortBy Optional parameter to sort by 'popular' (views), 'liked' (likes), or 'newest' (default)
   */
  async getPublicDecks(
    sortBy: "popular" | "newest" | "liked" = "newest"
  ): Promise<Deck[]> {
    try {
      await ensureDbConnection();

      // Sort by the specified field - Mongoose expects numeric values for sort order
      let sortOptions: Record<string, 1 | -1>;
      if (sortBy === "popular") {
        sortOptions = { views: -1 }; // Sort by views (descending)
      } else if (sortBy === "liked") {
        sortOptions = { likes: -1 }; // Sort by likes (descending)
      } else {
        sortOptions = { createdAt: -1 }; // Sort by createdAt (descending)
      }

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
   * Get public decks with user information using aggregation for better performance
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
    Array<{
      deck: Deck;
      user: { name: string; username: string | null };
      isLikedByCurrentUser: boolean;
      deckElements: string[];
    }>
  > {
    try {
      await ensureDbConnection();

      // Sort by the specified field
      let sortOptions: Record<string, 1 | -1>;
      if (sortBy === "popular") {
        sortOptions = { views: -1 };
      } else if (sortBy === "liked") {
        sortOptions = { likes: -1 };
      } else {
        sortOptions = { createdAt: -1 };
      }

      // Use aggregation to join with users collection for better performance
      const pipeline: any[] = [
        { $match: { isPublic: true } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $addFields: {
            user: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: "$userInfo",
                        as: "u",
                        in: {
                          name: { $ifNull: ["$$u.name", "Unknown User"] },
                          username: "$$u.username",
                        },
                      },
                    },
                    0,
                  ],
                },
                { name: "Unknown User", username: null },
              ],
            },
            deckElements: { $ifNull: ["$deckElements", []] },
            // Add like status for current user if provided
            isLikedByCurrentUser: currentUserId
              ? {
                  $in: [
                    new ObjectId(currentUserId),
                    { $ifNull: ["$likedBy", []] },
                  ],
                }
              : false,
          },
        },
        { $sort: sortOptions },
      ];

      // Add pagination if specified
      if (skip !== undefined) {
        pipeline.push({ $skip: skip });
      }
      if (limit !== undefined) {
        pipeline.push({ $limit: limit });
      }

      // Remove temporary fields as we've processed them
      pipeline.push({
        $project: {
          userInfo: 0,
        },
      });

      const results = await DeckModel.aggregate(pipeline);

      return results.map((result) => ({
        deck: convertAggregationToDeck(result),
        user: result.user,
        isLikedByCurrentUser: result.isLikedByCurrentUser || false,
        deckElements: result.deckElements || [],
      }));
    } catch (error) {
      console.error("Error getting public decks with user info:", error);
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
      const connection = await ensureDbConnection();
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
      await ensureDbConnection();
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
      await ensureDbConnection();
      const summary = await computeDeckSummary(deck.cards || []);
      const deckDoc = new DeckModel({
        ...convertDeckToDocument(deck),
        deckElements: summary.deckElements,
        totalCards: summary.totalCards,
      });
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
      await ensureDbConnection();
      const updateData = convertDeckToDocument(deck);
      const cardsToUpdate = Array.isArray(deck.cards) ? deck.cards : null;

      if (cardsToUpdate !== null) {
        const summary = await computeDeckSummary(cardsToUpdate);
        updateData.cards = cardsToUpdate;
        updateData.deckElements = summary.deckElements;
        updateData.totalCards = summary.totalCards;
      } else {
        delete updateData.cards;
        delete updateData.deckElements;
        delete updateData.totalCards;
      }

      const deckDoc = await DeckModel.findByIdAndUpdate(
        new ObjectId(id),
        { $set: updateData },
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
   * Checks for active competition usage before deletion
   */
  async deleteDeck(id: string): Promise<boolean> {
    try {
      // Use the newer, preferred database connection method
      await ensureDbConnection();

      // Import here to avoid circular dependencies
      const { CompetitionEntryModel } = await import(
        "../models/CompetitionEntry"
      );
      const { CompetitionModel } = await import("../models/Competition");
      const { COMPETITION_STATUS } = await import("../../constants");

      // Check if deck is used in any active competitions
      const competitionEntries = await CompetitionEntryModel.find({
        deckId: new ObjectId(id),
      }).populate("competitionId");

      // Filter for competitions that prevent deck deletion
      // Allow deletion only if competitions are UPCOMING or COMPLETED
      const blockingCompetitionEntries = competitionEntries.filter((entry) => {
        const competition = entry.competitionId as any;
        return (
          competition &&
          competition.status !== COMPETITION_STATUS.UPCOMING &&
          competition.status !== COMPETITION_STATUS.COMPLETED
        );
      });

      if (blockingCompetitionEntries.length > 0) {
        const competitionTitles = blockingCompetitionEntries
          .map((entry) => (entry.competitionId as any)?.title)
          .filter(Boolean)
          .join(", ");

        const competitionStatuses = blockingCompetitionEntries
          .map((entry) => (entry.competitionId as any)?.status)
          .filter(Boolean);

        throw new Error(
          `Cannot delete deck: it's currently used in competition(s): ${competitionTitles} ` +
            `(Status: ${competitionStatuses.join(", ")}). ` +
            `Deck deletion is only allowed when competitions are "upcoming" or "completed".`
        );
      }

      // If deck is only used in completed competitions, allow deletion
      // but update those entries to mark deck as deleted
      if (competitionEntries.length > 0) {
        const deck = await DeckModel.findById(new ObjectId(id));
        await CompetitionEntryModel.updateMany(
          { deckId: new ObjectId(id) },
          {
            $set: {
              deckId: null,
              deckDeletedAt: new Date(),
              originalDeckName: deck?.name || "Deleted Deck",
            },
          }
        );
      }

      // Proceed with deck deletion
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
      await ensureDbConnection();

      // Find the deck
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Check if the card already exists in the deck
      const existingCardIndex = deck.cards.findIndex(
        (c: DeckCard) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Update the quantity of the existing card
        deck.cards[existingCardIndex].quantity += quantity;
      } else {
        // Add the new card to the deck
        deck.cards.push({ cardId, quantity });
      }

      const summary = await computeDeckSummary(deck.cards);
      deck.deckElements = summary.deckElements;
      deck.totalCards = summary.totalCards;

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
      await ensureDbConnection();

      // Find the deck
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Find the card in the deck
      const existingCardIndex = deck.cards.findIndex(
        (c: DeckCard) => c.cardId === cardId
      );

      if (existingCardIndex >= 0) {
        // Decrease the quantity of the card
        deck.cards[existingCardIndex].quantity -= quantity;

        // If the quantity is 0 or less, remove the card from the deck
        if (deck.cards[existingCardIndex].quantity <= 0) {
          deck.cards.splice(existingCardIndex, 1);
        }

        const summary = await computeDeckSummary(deck.cards);
        deck.deckElements = summary.deckElements;
        deck.totalCards = summary.totalCards;

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
      await ensureDbConnection();

      const summary = await computeDeckSummary(cards);
      const deckDoc = await DeckModel.findByIdAndUpdate(
        new ObjectId(deckId),
        {
          $set: {
            cards,
            deckElements: summary.deckElements,
            totalCards: summary.totalCards,
          },
        },
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
      await ensureDbConnection();

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
   * Get decks containing a specific card with user information and card data
   * Optimized version using aggregation pipeline to eliminate N+1 queries
   */
  async getDecksContainingCardWithUserInfoOptimized(
    cardId: string,
    limit?: number
  ): Promise<
    Array<{
      deck: Deck;
      user: { name: string; username: string | null };
      cards: Card[];
    }>
  > {
    try {
      await ensureDbConnection();

      // Build aggregation pipeline for optimized query
      const pipeline: any[] = [
        // Match decks containing the specific card
        {
          $match: {
            "cards.cardId": cardId,
            isPublic: true,
          },
        },
        // Sort by creation date (newest first)
        { $sort: { createdAt: -1 } },
        // Apply limit if specified
        ...(limit ? [{ $limit: limit }] : []),
        // Join with users collection
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        // Join with cards collection for all cards in deck
        {
          $lookup: {
            from: "cards",
            localField: "cards.cardId",
            foreignField: "originalId",
            as: "cardDetails",
          },
        },
        // Process the results
        {
          $addFields: {
            user: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $map: {
                        input: "$userInfo",
                        as: "u",
                        in: {
                          name: { $ifNull: ["$$u.name", "Unknown User"] },
                          username: "$$u.username",
                        },
                      },
                    },
                    0,
                  ],
                },
                { name: "Unknown User", username: null },
              ],
            },
            // Map card details to maintain order and quantities
            cards: {
              $map: {
                input: "$cards",
                as: "deckCard",
                in: {
                  $mergeObjects: [
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$cardDetails",
                            cond: { $eq: ["$$this.originalId", "$$deckCard.cardId"] },
                          },
                        },
                        0,
                      ],
                    },
                    { quantity: "$$deckCard.quantity" },
                  ],
                },
              },
            },
          },
        },
        // Remove temporary fields
        {
          $project: {
            userInfo: 0,
            cardDetails: 0,
          },
        },
      ];

      const results = await DeckModel.aggregate(pipeline);

      return results.map((result) => ({
        deck: convertAggregationToDeck(result),
        user: result.user,
        cards: result.cards.filter((card: any) => card && card.id), // Filter out null cards
      }));
    } catch (error) {
      console.error(
        `Error getting decks containing card ${cardId} with optimized query:`,
        error
      );
      throw error;
    }
  },

  /**
   * Toggle like status for a deck
   * Uses atomic operations and database as source of truth for like count
   * Optimized to minimize database calls and handle race conditions
   */
  async toggleDeckLike(
    deckId: string,
    userId: ObjectId
  ): Promise<{ liked: boolean; likes: number } | null> {
    try {
      await ensureDbConnection();

      // First, try to remove the like (unlike operation)
      const unlikeResult = await DeckModel.findOneAndUpdate(
        {
          _id: new ObjectId(deckId),
          likedBy: userId, // Only update if user has already liked
        },
        {
          $pull: { likedBy: userId },
          $inc: { likes: -1 },
        },
        { new: true }
      );

      if (unlikeResult) {
        // User was already liked, so we unliked it
        return {
          liked: false,
          likes: Math.max(0, unlikeResult.likes || 0),
        };
      }

      // If unlike didn't work, try to add the like (like operation)
      const likeResult = await DeckModel.findOneAndUpdate(
        {
          _id: new ObjectId(deckId),
          likedBy: { $ne: userId }, // Only update if user hasn't liked yet
        },
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 },
        },
        { new: true }
      );

      if (likeResult) {
        // User wasn't liked before, so we liked it
        return {
          liked: true,
          likes: likeResult.likes || 1,
        };
      }

      // If neither operation worked, the deck might not exist
      // Check if deck exists
      const deck = await DeckModel.findById(new ObjectId(deckId));
      if (!deck) {
        return null;
      }

      // Edge case: deck exists but neither operation worked
      // This could happen if there's a race condition
      // Return current state
      const userIdString = userId.toString();
      const isLiked = deck.likedBy.some(
        (id: ObjectId) => id.toString() === userIdString
      );

      return {
        liked: isLiked,
        likes: Math.max(0, deck.likes || 0),
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
      await ensureDbConnection();
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
   * Optimized to use a single atomic operation
   */
  async incrementDeckViews(
    deckId: string,
    viewerId: string
  ): Promise<Deck | null> {
    try {
      await ensureDbConnection();

      // Use findOneAndUpdate with atomic operations for better performance
      // Only increment if the viewer hasn't already viewed the deck
      const updatedDeck = await DeckModel.findOneAndUpdate(
        {
          _id: new ObjectId(deckId),
          viewedBy: { $ne: viewerId }, // Only update if viewerId is not in viewedBy array
        },
        {
          $inc: { views: 1 },
          $push: { viewedBy: viewerId },
        },
        { new: true }
      );

      // If no document was updated, the deck either doesn't exist or was already viewed
      // Check if the deck exists
      if (!updatedDeck) {
        const existingDeck = await DeckModel.findById(new ObjectId(deckId));
        return existingDeck ? convertDocumentToDeck(existingDeck) : null;
      }

      return convertDocumentToDeck(updatedDeck);
    } catch (error) {
      console.error(`Error incrementing view count for deck ${deckId}:`, error);
      throw error;
    }
  },
};
