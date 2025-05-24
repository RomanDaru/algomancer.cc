import mongoose, { Schema, Document } from "mongoose";
import { Deck as DeckType, DeckCard } from "../../types/user";
import { ObjectId } from "mongodb";

// Interface for the MongoDB document
export interface DeckDocument extends Document, Omit<DeckType, "_id"> {
  // MongoDB adds _id automatically
}

// Schema for the DeckCard subdocument
const DeckCardSchema = new Schema(
  {
    cardId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 4 },
  },
  { _id: false }
);

// Main Deck schema
const DeckSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    youtubeUrl: { type: String }, // YouTube video URL for deck showcase
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    cards: { type: [DeckCardSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    views: { type: Number, default: 0 }, // Track number of views
    viewedBy: { type: [String], default: [] }, // Store IPs or session IDs that have viewed the deck
    likes: { type: Number, default: 0 }, // Track number of likes
    likedBy: { type: [Schema.Types.ObjectId], default: [], ref: "User" }, // Store user IDs who liked the deck
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create and export the model
export const DeckModel =
  mongoose.models.Deck || mongoose.model<DeckDocument>("Deck", DeckSchema);

// Helper function to convert between MongoDB document and our Deck type
export function convertDocumentToDeck(doc: DeckDocument): DeckType {
  const deck = doc.toObject();
  return {
    _id: deck._id,
    name: deck.name,
    description: deck.description,
    youtubeUrl: deck.youtubeUrl,
    userId: deck.userId,
    cards: deck.cards,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    isPublic: deck.isPublic,
    views: deck.views || 0,
    viewedBy: deck.viewedBy || [],
    likes: deck.likes || 0,
    likedBy: deck.likedBy || [],
  };
}

// Helper function to convert our Deck type to a MongoDB document
export function convertDeckToDocument(
  deck: Partial<DeckType>
): Partial<DeckDocument> {
  return {
    name: deck.name,
    description: deck.description,
    youtubeUrl: deck.youtubeUrl,
    userId: deck.userId,
    cards: deck.cards,
    isPublic: deck.isPublic,
  };
}
