import { ObjectId } from "mongodb";
import type { BasicElementType } from "./card";

export type GameLogOutcome = "win" | "loss" | "draw";
export type GameLogFormat = "constructed" | "live_draft";
export type GameLogMatchType = "1v1" | "2v2" | "ffa" | "custom";

export interface GameLogOpponent {
  name: string;
  userId?: ObjectId;
  elements?: BasicElementType[];
  externalDeckUrl?: string;
  mvpCardIds?: string[];
}

export interface GameLogConstructed {
  deckId?: ObjectId;
  externalDeckUrl?: string;
  teammateDeckId?: ObjectId;
  teammateExternalDeckUrl?: string;
}

export interface GameLogLiveDraft {
  elementsPlayed: BasicElementType[];
  mvpCardIds?: string[];
}

export interface GameLog {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  playedAt: Date;
  durationMinutes: number;
  outcome: GameLogOutcome;
  format: GameLogFormat;
  matchType: GameLogMatchType;
  matchTypeLabel?: string;
  isPublic: boolean;
  opponents: GameLogOpponent[];
  notes?: string;
  constructed?: GameLogConstructed;
  liveDraft?: GameLogLiveDraft;
  createdAt: Date;
  updatedAt: Date;
}
