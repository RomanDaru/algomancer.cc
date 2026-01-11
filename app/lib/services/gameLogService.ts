import type { GameLog } from "../types/gameLog";
import { gameLogDbService } from "../db/services/gameLogDbService";

export const gameLogService = {
  async getUserGameLogs(
    userId: string,
    options?: { skip?: number; limit?: number; format?: string; outcome?: string }
  ): Promise<GameLog[]> {
    try {
      return await gameLogDbService.getUserGameLogs(userId, options);
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
      return await gameLogDbService.countUserGameLogs(userId, options);
    } catch (error) {
      console.error(`Error counting game logs for user ${userId}:`, error);
      throw error;
    }
  },

  async getGameLogById(id: string): Promise<GameLog | null> {
    try {
      return await gameLogDbService.getGameLogById(id);
    } catch (error) {
      console.error(`Error getting game log with ID ${id}:`, error);
      throw error;
    }
  },

  async createGameLog(log: Partial<GameLog>): Promise<GameLog> {
    try {
      return await gameLogDbService.createGameLog(log);
    } catch (error) {
      console.error("Error creating game log:", error);
      throw error;
    }
  },

  async updateGameLog(
    id: string,
    log: Partial<GameLog>
  ): Promise<GameLog | null> {
    try {
      return await gameLogDbService.updateGameLog(id, log);
    } catch (error) {
      console.error(`Error updating game log with ID ${id}:`, error);
      throw error;
    }
  },

  async deleteGameLog(id: string): Promise<boolean> {
    try {
      return await gameLogDbService.deleteGameLog(id);
    } catch (error) {
      console.error(`Error deleting game log with ID ${id}:`, error);
      throw error;
    }
  },
};
