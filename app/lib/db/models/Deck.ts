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
    deckElements: { type: [String], default: ["Colorless"] },
    totalCards: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    views: { type: Number, default: 0 }, // Track number of views
    viewedBy: { type: [String], default: [] }, // Store IPs or session IDs that have viewed the deck
    likes: { type: Number, default: 0 }, // Track number of likes
    likedBy: { type: [Schema.Types.ObjectId], default: [], ref: "User" }, // Store user IDs who liked the deck
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
DeckSchema.index({ isPublic: 1 }); // For public deck queries
DeckSchema.index({ userId: 1 }); // For user deck queries
DeckSchema.index({ "cards.cardId": 1 }); // For finding decks containing specific cards
DeckSchema.index({ isPublic: 1, createdAt: -1 }); // For public decks sorted by date
DeckSchema.index({ isPublic: 1, views: -1 }); // For popular decks
DeckSchema.index({ isPublic: 1, likes: -1 }); // For most liked decks
DeckSchema.index({ userId: 1, createdAt: -1 }); // For user decks sorted by date
DeckSchema.index({ "cards.cardId": 1, isPublic: 1, createdAt: -1 }); // Compound index for card-specific deck queries

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
    deckElements: deck.deckElements || [],
    totalCards: typeof deck.totalCards === "number" ? deck.totalCards : undefined,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    isPublic: deck.isPublic,
    views: deck.views || 0,
    viewedBy: deck.viewedBy || [],
    likes: deck.likes || 0,
    likedBy: deck.likedBy || [],
  };
}

// Helper function to convert aggregation result (plain object) to our Deck type
export function convertAggregationToDeck(obj: any): DeckType {
  return {
    _id: obj._id,
    name: obj.name,
    description: obj.description,
    youtubeUrl: obj.youtubeUrl,
    userId: obj.userId,
    cards: obj.cards || [],
    deckElements: obj.deckElements || [],
    totalCards: typeof obj.totalCards === "number" ? obj.totalCards : undefined,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    isPublic: obj.isPublic,
    views: obj.views || 0,
    viewedBy: obj.viewedBy || [],
    likes: obj.likes || 0,
    likedBy: obj.likedBy || [],
  };
}

// Universal helper function that can handle both Mongoose documents and plain objects
export function convertToDeck(input: DeckDocument | any): DeckType {
  // Check if it's a Mongoose document (has toObject method)
  const obj = typeof input.toObject === "function" ? input.toObject() : input;

  return {
    _id: obj._id,
    name: obj.name,
    description: obj.description,
    youtubeUrl: obj.youtubeUrl,
    userId: obj.userId,
    cards: obj.cards || [],
    deckElements: obj.deckElements || [],
    totalCards: typeof obj.totalCards === "number" ? obj.totalCards : undefined,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    isPublic: obj.isPublic,
    views: obj.views || 0,
    viewedBy: obj.viewedBy || [],
    likes: obj.likes || 0,
    likedBy: obj.likedBy || [],
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
    deckElements: deck.deckElements,
    totalCards: deck.totalCards,
  };
}
