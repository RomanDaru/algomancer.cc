import mongoose, { Schema, Document } from "mongoose";
import type {
  GameLog,
  GameLogConstructed,
  GameLogLiveDraft,
  GameLogOpponent,
} from "../../types/gameLog";

export interface GameLogDocument extends Document, Omit<GameLog, "_id"> {}

const OpponentSchema = new Schema<GameLogOpponent>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    elements: { type: [String], default: [] },
    externalDeckUrl: { type: String, trim: true },
    mvpCardIds: { type: [String], default: [] },
  },
  { _id: false }
);

const ConstructedSchema = new Schema<GameLogConstructed>(
  {
    deckId: { type: Schema.Types.ObjectId, ref: "Deck" },
    externalDeckUrl: { type: String, trim: true },
    teammateDeckId: { type: Schema.Types.ObjectId, ref: "Deck" },
    teammateExternalDeckUrl: { type: String, trim: true },
    elementsPlayed: { type: [String], default: [] },
  },
  { _id: false }
);

const LiveDraftSchema = new Schema<GameLogLiveDraft>(
  {
    elementsPlayed: { type: [String], default: [] },
    mvpCardIds: { type: [String], default: [] },
  },
  { _id: false }
);

const GameLogSchema = new Schema<GameLogDocument>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    title: { type: String, default: "Untitled Game", trim: true },
    playedAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    outcome: { type: String, enum: ["win", "loss", "draw"], required: true },
    format: {
      type: String,
      enum: ["constructed", "live_draft"],
      required: true,
    },
    matchType: {
      type: String,
      enum: ["1v1", "2v2", "ffa", "custom"],
      required: true,
    },
    matchTypeLabel: {
      type: String,
      trim: true,
      required: function (this: GameLogDocument) {
        return this.matchType === "custom";
      },
    },
    isPublic: { type: Boolean, default: false },
    includeInCommunityStats: { type: Boolean, default: false },
    opponents: { type: [OpponentSchema], default: [] },
    notes: { type: String, trim: true },
    constructed: { type: ConstructedSchema },
    liveDraft: { type: LiveDraftSchema },
  },
  {
    timestamps: true,
  }
);

GameLogSchema.index({ userId: 1, playedAt: -1 });
GameLogSchema.index({ isPublic: 1, playedAt: -1 });
GameLogSchema.index({ includeInCommunityStats: 1, playedAt: -1 });
GameLogSchema.index({ outcome: 1, playedAt: -1 });
GameLogSchema.index({ "liveDraft.mvpCardIds": 1 });

export const GameLogModel =
  mongoose.models.GameLog || mongoose.model<GameLogDocument>("GameLog", GameLogSchema);

export function convertDocumentToGameLog(doc: GameLogDocument): GameLog {
  const log = doc.toObject();
  return {
    _id: log._id,
    userId: log.userId,
    title: log.title,
    playedAt: log.playedAt,
    durationMinutes: log.durationMinutes,
    outcome: log.outcome,
    format: log.format,
    matchType: log.matchType,
    matchTypeLabel: log.matchTypeLabel,
    isPublic: log.isPublic,
    includeInCommunityStats: log.includeInCommunityStats,
    opponents: log.opponents || [],
    notes: log.notes,
    constructed: log.constructed,
    liveDraft: log.liveDraft,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

export function convertGameLogToDocument(
  log: Partial<GameLog>
): Partial<GameLogDocument> {
  return {
    userId: log.userId,
    title: log.title,
    playedAt: log.playedAt,
    durationMinutes: log.durationMinutes,
    outcome: log.outcome,
    format: log.format,
    matchType: log.matchType,
    matchTypeLabel: log.matchTypeLabel,
    isPublic: log.isPublic,
    includeInCommunityStats: log.includeInCommunityStats,
    opponents: log.opponents,
    notes: log.notes,
    constructed: log.constructed,
    liveDraft: log.liveDraft,
  };
}
