import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongodb";
import type { GameLog } from "../../types/gameLog";
import {
  GameLogModel,
  convertDocumentToGameLog,
  convertGameLogToDocument,
} from "../models/GameLog";
import { buildGameLogUpdate } from "../../utils/gameLogUpdate";

let dbConnection: any = null;

async function ensureDbConnection() {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
  }
  return dbConnection;
}

export const gameLogDbService = {
  async getUserGameLogs(
    userId: string,
    options?: {
      skip?: number;
      limit?: number;
      format?: string;
      outcome?: string;
    }
  ): Promise<GameLog[]> {
    try {
      await ensureDbConnection();
      const query: Record<string, any> = {
        userId: new ObjectId(userId),
      };

      if (options?.format) {
        query.format = options.format;
      }
      if (options?.outcome) {
        query.outcome = options.outcome;
      }

      const cursor = GameLogModel.find(query).sort({ playedAt: -1 });

      if (typeof options?.skip === "number") {
        cursor.skip(options.skip);
      }
      if (typeof options?.limit === "number") {
        cursor.limit(options.limit);
      }

      const docs = await cursor;
      return docs.map(convertDocumentToGameLog);
    } catch (error) {
      console.error(`Error getting game logs for user ${userId}:`, error);
      throw error;
    }
  },

  async countUserGameLogs(
    userId: string,
    options?: { format?: string; outcome?: string }
  ): Promise<number> {
    try {
      await ensureDbConnection();
      const query: Record<string, any> = {
        userId: new ObjectId(userId),
      };

      if (options?.format) {
        query.format = options.format;
      }
      if (options?.outcome) {
        query.outcome = options.outcome;
      }

      return await GameLogModel.countDocuments(query);
    } catch (error) {
      console.error(`Error counting game logs for user ${userId}:`, error);
      throw error;
    }
  },

  async getGameLogById(id: string): Promise<GameLog | null> {
    try {
      await ensureDbConnection();
      const doc = await GameLogModel.findById(new ObjectId(id));
      return doc ? convertDocumentToGameLog(doc) : null;
    } catch (error) {
      console.error(`Error getting game log with ID ${id}:`, error);
      throw error;
    }
  },

  async createGameLog(log: Partial<GameLog>): Promise<GameLog> {
    try {
      await ensureDbConnection();
      const doc = new GameLogModel(convertGameLogToDocument(log));
      await doc.save();
      return convertDocumentToGameLog(doc);
    } catch (error) {
      console.error("Error creating game log:", error);
      throw error;
    }
  },

  async updateGameLog(id: string, log: Partial<GameLog>): Promise<GameLog | null> {
    try {
      await ensureDbConnection();
      const update = buildGameLogUpdate(log);
      const updateDoc: Record<string, any> = {};
      if (Object.keys(update.$set).length > 0) {
        updateDoc.$set = update.$set;
      }
      if (Object.keys(update.$unset).length > 0) {
        updateDoc.$unset = update.$unset;
      }

      if (Object.keys(updateDoc).length === 0) {
        const doc = await GameLogModel.findById(new ObjectId(id));
        return doc ? convertDocumentToGameLog(doc) : null;
      }

      const doc = await GameLogModel.findByIdAndUpdate(
        new ObjectId(id),
        updateDoc,
        { new: true, runValidators: true }
      );
      return doc ? convertDocumentToGameLog(doc) : null;
    } catch (error) {
      console.error(`Error updating game log with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteGameLog(id: string): Promise<boolean> {
    try {
      await ensureDbConnection();
      const result = await GameLogModel.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount === 1;
    } catch (error) {
      console.error(`Error deleting game log with ID ${id}:`, error);
      throw error;
    }
  },
};
