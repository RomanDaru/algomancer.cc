import mongoose, { Schema, Document } from "mongoose";
import { Card as CardType } from "../../types/card";

// Interface for the MongoDB document
export interface CardDocument extends Document, Omit<CardType, "id"> {
  // MongoDB adds _id automatically, so we omit the id field from CardType
}

// Schema for the Element subdocument
const ElementSchema = new Schema(
  {
    type: { type: String, required: true },
    symbol: { type: String, required: true },
    secondarySymbol: { type: String },
  },
  { _id: false }
);

// Schema for the Affinity subdocument
const AffinitySchema = new Schema(
  {
    fire: { type: Number, min: 0 },
    water: { type: Number, min: 0 },
    earth: { type: Number, min: 0 },
    wood: { type: Number, min: 0 },
    metal: { type: Number, min: 0 },
  },
  { _id: false }
);

// Schema for the Stats subdocument
const StatsSchema = new Schema(
  {
    power: { type: Number, required: true },
    defense: { type: Number, required: true },
    affinity: { type: AffinitySchema, required: true },
  },
  { _id: false }
);

// Schema for the Timing subdocument
const TimingSchema = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

// Schema for the TypeAndAttributes subdocument
const TypeAndAttributesSchema = new Schema(
  {
    mainType: { type: String, required: true },
    subType: { type: String, required: true },
    attributes: { type: [String], default: [] },
  },
  { _id: false }
);

// Schema for the Set subdocument
const SetSchema = new Schema(
  {
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    complexity: { type: String, required: true },
  },
  { _id: false }
);

// Main Card schema
const CardSchema = new Schema(
  {
    // We'll use MongoDB's _id as our primary key, but we'll also store the original id
    originalId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    manaCost: { type: Number, required: true },
    element: { type: ElementSchema, required: true },
    stats: { type: StatsSchema, required: true },
    timing: { type: TimingSchema, required: true },
    typeAndAttributes: { type: TypeAndAttributesSchema, required: true },
    abilities: { type: [String], default: [] },
    set: { type: SetSchema, required: true },
    imageUrl: { type: String, required: true },
    flavorText: { type: String },
    currentIndex: { type: Number },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
CardSchema.index({ originalId: 1 }); // For finding cards by ID (most common query)
CardSchema.index({ id: 1 }); // Alternative ID field
CardSchema.index({ currentIndex: 1 }); // For sorting cards by index
CardSchema.index({ name: 1 }); // For searching cards by name
CardSchema.index({ "typeAndAttributes.type": 1 }); // For filtering by card type
CardSchema.index({ "elements.primary": 1 }); // For filtering by primary element
CardSchema.index({ manaCost: 1 }); // For sorting by mana cost

// Create and export the model
export const CardModel =
  mongoose.models.Card || mongoose.model<CardDocument>("Card", CardSchema);

// Helper function to convert between MongoDB document and our Card type
export function convertDocumentToCard(doc: CardDocument): CardType {
  const card = doc.toObject();
  return {
    id: card.originalId,
    name: card.name,
    manaCost: card.manaCost,
    element: card.element,
    stats: card.stats,
    timing: card.timing,
    typeAndAttributes: card.typeAndAttributes,
    abilities: card.abilities,
    set: card.set,
    imageUrl: card.imageUrl,
    flavorText: card.flavorText,
    currentIndex: card.currentIndex,
  };
}

// Helper function to convert our Card type to a MongoDB document
export function convertCardToDocument(card: CardType): Partial<CardDocument> {
  return {
    originalId: card.id,
    name: card.name,
    manaCost: card.manaCost,
    element: card.element,
    stats: card.stats,
    timing: card.timing,
    typeAndAttributes: card.typeAndAttributes,
    abilities: card.abilities,
    set: card.set,
    imageUrl: card.imageUrl,
    flavorText: card.flavorText,
    currentIndex: card.currentIndex,
  };
}
