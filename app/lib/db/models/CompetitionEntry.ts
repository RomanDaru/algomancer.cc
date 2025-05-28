import mongoose, { Schema, Document } from "mongoose";
import { CompetitionEntry as CompetitionEntryType } from "../../types/user";
import { ObjectId } from "mongodb";

// Interface for the MongoDB document
export interface CompetitionEntryDocument extends Document, Omit<CompetitionEntryType, "_id"> {
  // MongoDB adds _id automatically
}

// Main CompetitionEntry schema
const CompetitionEntrySchema = new Schema(
  {
    competitionId: { type: Schema.Types.ObjectId, required: true, ref: "Competition" },
    deckId: { type: Schema.Types.ObjectId, required: true, ref: "Deck" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    submittedAt: { type: Date, default: Date.now },
    discordMessageId: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create compound index to prevent duplicate entries
CompetitionEntrySchema.index({ competitionId: 1, deckId: 1 }, { unique: true });
CompetitionEntrySchema.index({ competitionId: 1, userId: 1 });

// Create and export the model
export const CompetitionEntryModel =
  mongoose.models.CompetitionEntry || 
  mongoose.model<CompetitionEntryDocument>("CompetitionEntry", CompetitionEntrySchema);

// Helper function to convert between MongoDB document and our CompetitionEntry type
export function convertDocumentToCompetitionEntry(doc: CompetitionEntryDocument): CompetitionEntryType {
  const entry = doc.toObject();
  return {
    _id: entry._id,
    competitionId: entry.competitionId,
    deckId: entry.deckId,
    userId: entry.userId,
    submittedAt: entry.submittedAt,
    discordMessageId: entry.discordMessageId,
  };
}

// Helper function to convert our CompetitionEntry type to a MongoDB document
export function convertCompetitionEntryToDocument(
  entry: Partial<CompetitionEntryType>
): Partial<CompetitionEntryDocument> {
  return {
    competitionId: entry.competitionId,
    deckId: entry.deckId,
    userId: entry.userId,
    submittedAt: entry.submittedAt,
    discordMessageId: entry.discordMessageId,
  };
}
