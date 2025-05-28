import mongoose, { Schema, Document } from "mongoose";
import { Competition as CompetitionType, CompetitionWinner } from "../../types/user";
import { ObjectId } from "mongodb";

// Interface for the MongoDB document
export interface CompetitionDocument extends Document, Omit<CompetitionType, "_id"> {
  // MongoDB adds _id automatically
}

// Schema for the CompetitionWinner subdocument
const CompetitionWinnerSchema = new Schema(
  {
    place: { type: Number, required: true, enum: [1, 2, 3] },
    deckId: { type: Schema.Types.ObjectId, required: true, ref: "Deck" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    votes: { type: Number, min: 0 },
  },
  { _id: false }
);

// Main Competition schema
const CompetitionSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      required: true, 
      enum: ["constructed", "draft"] 
    },
    status: { 
      type: String, 
      required: true, 
      enum: ["upcoming", "active", "voting", "completed"],
      default: "upcoming"
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    votingEndDate: { type: Date, required: true },
    discordChannelId: { type: String },
    submissionCount: { type: Number, default: 0, min: 0 },
    winners: { type: [CompetitionWinnerSchema], default: [] },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create and export the model
export const CompetitionModel =
  mongoose.models.Competition || mongoose.model<CompetitionDocument>("Competition", CompetitionSchema);

// Helper function to convert between MongoDB document and our Competition type
export function convertDocumentToCompetition(doc: CompetitionDocument): CompetitionType {
  const competition = doc.toObject();
  return {
    _id: competition._id,
    title: competition.title,
    description: competition.description,
    type: competition.type,
    status: competition.status,
    startDate: competition.startDate,
    endDate: competition.endDate,
    votingEndDate: competition.votingEndDate,
    discordChannelId: competition.discordChannelId,
    submissionCount: competition.submissionCount || 0,
    winners: competition.winners || [],
    createdAt: competition.createdAt,
    updatedAt: competition.updatedAt,
  };
}

// Helper function to convert our Competition type to a MongoDB document
export function convertCompetitionToDocument(
  competition: Partial<CompetitionType>
): Partial<CompetitionDocument> {
  return {
    title: competition.title,
    description: competition.description,
    type: competition.type,
    status: competition.status,
    startDate: competition.startDate,
    endDate: competition.endDate,
    votingEndDate: competition.votingEndDate,
    discordChannelId: competition.discordChannelId,
    submissionCount: competition.submissionCount,
    winners: competition.winners,
  };
}
