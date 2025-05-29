import { Competition, CompetitionEntry } from "../../types/user";
import { connectToDatabase } from "../mongodb";
import mongoose from "../mongodb";
import {
  CompetitionModel,
  convertCompetitionToDocument,
  convertDocumentToCompetition,
} from "../models/Competition";
import { CompetitionEntryModel } from "../models/CompetitionEntry";
import { UserModel } from "../models/User";
import { DeckModel } from "../models/Deck";
import { ObjectId } from "mongodb";

/**
 * Service for interacting with the competition database
 */
export const competitionDbService = {
  /**
   * Get all competitions
   */
  async getAllCompetitions(status?: string): Promise<Competition[]> {
    try {
      await connectToDatabase();

      let query = {};
      if (status) {
        query = { status };
      }

      const competitionDocs = await CompetitionModel.find(query).sort({
        createdAt: -1,
      });
      return competitionDocs.map(convertDocumentToCompetition);
    } catch (error) {
      console.error("Error getting all competitions:", error);
      throw error;
    }
  },

  /**
   * Get a competition by ID
   */
  async getCompetitionById(id: string): Promise<Competition | null> {
    try {
      await connectToDatabase();
      const competitionDoc = await CompetitionModel.findById(new ObjectId(id));
      return competitionDoc
        ? convertDocumentToCompetition(competitionDoc)
        : null;
    } catch (error) {
      console.error(`Error getting competition with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get a competition by ID with populated winner and deck data
   */
  async getCompetitionWithWinners(id: string): Promise<Competition | null> {
    try {
      await connectToDatabase();
      const competitionDoc = await CompetitionModel.findById(new ObjectId(id));

      if (!competitionDoc) return null;

      const competition = convertDocumentToCompetition(competitionDoc);

      // Manually fetch user and deck data for winners using direct MongoDB queries
      if (competition.winners && competition.winners.length > 0) {
        const db = mongoose.connection.db;

        const enrichedWinners = await Promise.all(
          competition.winners.map(async (winner) => {
            // Fetch user data directly from MongoDB
            let userData = undefined;
            try {
              // Convert string ID to ObjectId for MongoDB query
              const userObjectId = new ObjectId(winner.userId.toString());

              const userDoc = await db
                .collection("users")
                .findOne(
                  { _id: userObjectId },
                  { projection: { name: 1, email: 1, username: 1 } }
                );
              if (userDoc) {
                userData = {
                  _id: userDoc._id,
                  name: userDoc.name,
                  email: userDoc.email,
                  username: userDoc.username,
                };
              }
            } catch (userError) {
              console.warn(
                `Could not fetch user data for ${winner.userId}:`,
                userError
              );
            }

            // Fetch deck data directly from MongoDB
            let deckData = undefined;
            try {
              // Convert string ID to ObjectId for MongoDB query
              const deckObjectId = new ObjectId(winner.deckId.toString());

              const deckDoc = await db
                .collection("decks")
                .findOne(
                  { _id: deckObjectId },
                  { projection: { name: 1, description: 1, userId: 1 } }
                );
              if (deckDoc) {
                deckData = {
                  _id: deckDoc._id,
                  name: deckDoc.name,
                  description: deckDoc.description,
                };

                // If user wasn't found but deck exists, try to get user from deck's userId
                if (!userData && deckDoc.userId) {
                  try {
                    const deckOwnerDoc = await db
                      .collection("users")
                      .findOne(
                        { _id: deckDoc.userId },
                        { projection: { name: 1, email: 1, username: 1 } }
                      );
                    if (deckOwnerDoc) {
                      userData = {
                        _id: deckOwnerDoc._id,
                        name: deckOwnerDoc.name,
                        email: deckOwnerDoc.email,
                        username: deckOwnerDoc.username,
                      };
                    }
                  } catch (ownerError) {
                    console.warn(`Could not fetch deck owner:`, ownerError);
                  }
                }
              }
            } catch (deckError) {
              console.warn(
                `Could not fetch deck data for ${winner.deckId}:`,
                deckError
              );
            }

            return {
              place: winner.place,
              deckId: winner.deckId,
              userId: winner.userId,
              votes: winner.votes,
              user: userData,
              deck: deckData,
            };
          })
        );

        competition.winners = enrichedWinners;
      }

      return competition;
    } catch (error) {
      console.error(
        `Error getting competition with winners for ID ${id}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Create a new competition
   */
  async createCompetition(
    competition: Partial<Competition>
  ): Promise<Competition> {
    try {
      await connectToDatabase();
      const competitionDoc = new CompetitionModel(
        convertCompetitionToDocument(competition)
      );
      await competitionDoc.save();
      return convertDocumentToCompetition(competitionDoc);
    } catch (error) {
      console.error("Error creating competition:", error);
      throw error;
    }
  },

  /**
   * Update a competition
   */
  async updateCompetition(
    id: string,
    updates: Partial<Competition>
  ): Promise<Competition | null> {
    try {
      await connectToDatabase();
      const competitionDoc = await CompetitionModel.findByIdAndUpdate(
        new ObjectId(id),
        convertCompetitionToDocument(updates),
        { new: true }
      );
      return competitionDoc
        ? convertDocumentToCompetition(competitionDoc)
        : null;
    } catch (error) {
      console.error(`Error updating competition with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a competition
   */
  async deleteCompetition(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const result = await CompetitionModel.findByIdAndDelete(new ObjectId(id));
      return !!result;
    } catch (error) {
      console.error(`Error deleting competition with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get competition entries
   */
  async getCompetitionEntries(
    competitionId: string
  ): Promise<CompetitionEntry[]> {
    try {
      await connectToDatabase();
      const entryDocs = await CompetitionEntryModel.find({
        competitionId: new ObjectId(competitionId),
      }).sort({ submittedAt: -1 });

      return entryDocs.map((doc) => ({
        _id: doc._id,
        competitionId: doc.competitionId,
        deckId: doc.deckId,
        userId: doc.userId,
        submittedAt: doc.submittedAt,
        discordMessageId: doc.discordMessageId,
        deckDeletedAt: doc.deckDeletedAt,
        originalDeckName: doc.originalDeckName,
      }));
    } catch (error) {
      console.error(
        `Error getting entries for competition ${competitionId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Create a competition entry
   */
  async createCompetitionEntry(
    entry: Partial<CompetitionEntry>
  ): Promise<CompetitionEntry> {
    try {
      await connectToDatabase();

      // Check if entry already exists
      const existingEntry = await CompetitionEntryModel.findOne({
        competitionId: entry.competitionId,
        deckId: entry.deckId,
      });

      if (existingEntry) {
        throw new Error("Deck already submitted to this competition");
      }

      const entryDoc = new CompetitionEntryModel(entry);
      await entryDoc.save();

      // Update submission count
      await CompetitionModel.findByIdAndUpdate(entry.competitionId, {
        $inc: { submissionCount: 1 },
      });

      return {
        _id: entryDoc._id,
        competitionId: entryDoc.competitionId,
        deckId: entryDoc.deckId,
        userId: entryDoc.userId,
        submittedAt: entryDoc.submittedAt,
        discordMessageId: entryDoc.discordMessageId,
        deckDeletedAt: entryDoc.deckDeletedAt,
        originalDeckName: entryDoc.originalDeckName,
      };
    } catch (error) {
      console.error("Error creating competition entry:", error);
      throw error;
    }
  },

  /**
   * Delete a competition entry
   */
  async deleteCompetitionEntry(entryId: string): Promise<boolean> {
    try {
      await connectToDatabase();

      const entry = await CompetitionEntryModel.findById(new ObjectId(entryId));
      if (!entry) {
        return false;
      }

      await CompetitionEntryModel.findByIdAndDelete(new ObjectId(entryId));

      // Update submission count
      await CompetitionModel.findByIdAndUpdate(entry.competitionId, {
        $inc: { submissionCount: -1 },
      });

      return true;
    } catch (error) {
      console.error(
        `Error deleting competition entry with ID ${entryId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Withdraw user's submission from a competition
   * Only allows withdrawal during UPCOMING phase
   */
  async withdrawSubmission(
    competitionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await connectToDatabase();

      // Import constants here to avoid circular dependencies
      const { COMPETITION_STATUS } = await import("../../constants");

      // Check competition status first
      const competition = await CompetitionModel.findById(
        new ObjectId(competitionId)
      );
      if (!competition) {
        throw new Error("Competition not found");
      }

      if (competition.status !== COMPETITION_STATUS.UPCOMING) {
        throw new Error(
          `Cannot withdraw submission: Competition is ${competition.status}. ` +
            `Withdrawals are only allowed during the "upcoming" phase.`
        );
      }

      // Find the user's entry in this competition
      const entry = await CompetitionEntryModel.findOne({
        competitionId: new ObjectId(competitionId),
        userId: new ObjectId(userId),
      });

      if (!entry) {
        return false;
      }

      // Delete the entry
      await CompetitionEntryModel.findByIdAndDelete(entry._id);

      // Update submission count
      await CompetitionModel.findByIdAndUpdate(new ObjectId(competitionId), {
        $inc: { submissionCount: -1 },
      });

      return true;
    } catch (error) {
      console.error(
        `Error withdrawing submission for user ${userId} from competition ${competitionId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Update competition status
   */
  async updateCompetitionStatus(
    id: string,
    status: Competition["status"]
  ): Promise<Competition | null> {
    try {
      await connectToDatabase();
      const competitionDoc = await CompetitionModel.findByIdAndUpdate(
        new ObjectId(id),
        { status, updatedAt: new Date() },
        { new: true }
      );
      return competitionDoc
        ? convertDocumentToCompetition(competitionDoc)
        : null;
    } catch (error) {
      console.error(`Error updating competition status for ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Set competition winners
   */
  async setCompetitionWinners(
    id: string,
    winners: Competition["winners"]
  ): Promise<Competition | null> {
    try {
      await connectToDatabase();
      const competitionDoc = await CompetitionModel.findByIdAndUpdate(
        new ObjectId(id),
        { winners, status: "completed", updatedAt: new Date() },
        { new: true }
      );
      return competitionDoc
        ? convertDocumentToCompetition(competitionDoc)
        : null;
    } catch (error) {
      console.error(`Error setting winners for competition ID ${id}:`, error);
      throw error;
    }
  },
};
