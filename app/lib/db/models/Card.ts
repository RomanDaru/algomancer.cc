import mongoose, { Schema, HydratedDocument } from "mongoose";
import { Card as CardType } from "../../types/card";
import { isCardValue } from "../../utils/cardValues";

type CardDocRaw = Omit<CardType, "id"> & {
  originalId: string;
};

export type CardDocument = HydratedDocument<CardDocRaw>;

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
    dark: { type: Number, min: 0 },
    light: { type: Number, min: 0 },
    prismite: { type: Number, min: 0 },
  },
  { _id: false }
);

// Schema for the Stats subdocument
const StatsSchema = new Schema(
  {
    power: { type: Schema.Types.Mixed, required: true, validate: isCardValue },
    defense: { type: Schema.Types.Mixed, required: true, validate: isCardValue },
    affinity: { type: AffinitySchema, required: true },
  },
  { _id: false }
);

// Schema for the Timing subdocument
const TimingSchema = new Schema(
  {
    type: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// Schema for the TypeAndAttributes subdocument
const TypeAndAttributesSchema = new Schema(
  {
    mainType: { type: String, required: true },
    subType: { type: String, default: "" },
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
    manaCost: { type: Schema.Types.Mixed, required: true, validate: (value: unknown) => isCardValue(value) && (value === "X" || value >= 0) },
    element: { type: ElementSchema, required: true },
    stats: { type: StatsSchema, required: true },
    timing: { type: TimingSchema, required: true },
    typeAndAttributes: { type: TypeAndAttributesSchema, required: true },
    abilities: { type: [String], default: [] },
    prophecy: { type: new Schema({
      manaCost: { type: Schema.Types.Mixed, required: true, validate: (value: unknown) => isCardValue(value) && (value === "X" || value >= 0) },
      affinity: { type: AffinitySchema, required: true },
      condition: { type: String, required: true },
    }, { _id: false }), default: null },
    augmentTransfers: { type: [String], default: [] },
    oracleImport: { type: new Schema({
      batchId: { type: String, required: true },
      reviewHash: { type: String, required: true },
      approvedRulesText: { type: String, default: "" },
      approvedProphecyCondition: String,
      importedAt: { type: Date, required: true },
    }, { _id: false }) },
    set: { type: SetSchema, required: true },
    imageUrl: { type: String, required: true },
    flavorText: { type: String },
    currentIndex: { type: Number },
    rulesVersion: { type: Number, default: 1, min: 1 },
    rulesUpdatedAt: { type: Date, default: Date.now },
    assetUpdatedAt: { type: Date, default: Date.now },
    lastChangeScope: { type: String, enum: ["asset", "rules"] },
    lastChangeSummary: { type: String },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
CardSchema.index({ originalId: 1 }); // For finding cards by ID (most common query)
CardSchema.index({ currentIndex: 1 }); // For sorting cards by index
CardSchema.index({ name: 1 }); // For searching cards by name
CardSchema.index({ "typeAndAttributes.mainType": 1 }); // For filtering by main card type
CardSchema.index({ "element.type": 1 }); // For filtering by primary element
CardSchema.index({ manaCost: 1 }); // For sorting by mana cost

// Create and export the model
export const CardModel =
  mongoose.models.Card || mongoose.model<CardDocument>("Card", CardSchema);

// Helper function to convert between MongoDB document and our Card type
export function convertDocumentToCard(doc: CardDocument): CardType {
  const card = doc.toObject<CardDocRaw>();
  return {
    id: card.originalId,
    name: card.name,
    manaCost: card.manaCost,
    element: card.element,
    stats: card.stats,
    timing: card.timing,
    typeAndAttributes: card.typeAndAttributes,
    abilities: card.abilities,
    prophecy: card.prophecy ?? null,
    augmentTransfers: card.augmentTransfers || [],
    oracleImport: card.oracleImport,
    set: card.set,
    imageUrl: card.imageUrl,
    flavorText: card.flavorText,
    currentIndex: card.currentIndex,
    rulesVersion: typeof card.rulesVersion === "number" ? card.rulesVersion : 1,
    rulesUpdatedAt: card.rulesUpdatedAt,
    assetUpdatedAt: card.assetUpdatedAt,
    lastChangeScope: card.lastChangeScope,
    lastChangeSummary: card.lastChangeSummary,
  };
}

// Helper function to convert our Card type to a MongoDB document
export function convertCardToDocument(card: CardType): CardDocRaw {
  return {
    originalId: card.id,
    name: card.name,
    manaCost: card.manaCost,
    element: card.element,
    stats: card.stats,
    timing: card.timing,
    typeAndAttributes: card.typeAndAttributes,
    abilities: card.abilities,
    ...(card.prophecy !== undefined ? { prophecy: card.prophecy } : {}),
    ...(card.augmentTransfers !== undefined ? { augmentTransfers: card.augmentTransfers } : {}),
    ...(card.oracleImport !== undefined ? { oracleImport: card.oracleImport } : {}),
    set: card.set,
    imageUrl: card.imageUrl,
    ...(card.flavorText !== undefined ? { flavorText: card.flavorText } : {}),
    ...(card.currentIndex !== undefined
      ? { currentIndex: card.currentIndex }
      : {}),
    ...(card.rulesVersion !== undefined
      ? { rulesVersion: card.rulesVersion }
      : {}),
    ...(card.rulesUpdatedAt !== undefined
      ? { rulesUpdatedAt: card.rulesUpdatedAt }
      : {}),
    ...(card.assetUpdatedAt !== undefined
      ? { assetUpdatedAt: card.assetUpdatedAt }
      : {}),
    ...(card.lastChangeScope !== undefined
      ? { lastChangeScope: card.lastChangeScope }
      : {}),
    ...(card.lastChangeSummary !== undefined
      ? { lastChangeSummary: card.lastChangeSummary }
      : {}),
  };
}
