import mongoose, { Schema, Document } from "mongoose";
import { Badge as BadgeType } from "../../types/user";

// Interface for the MongoDB document
export interface BadgeDocument extends Document, Omit<BadgeType, "_id"> {
  // MongoDB adds _id automatically
}

// Main Badge schema
const BadgeSchema = new Schema(
  {
    type: { 
      type: String, 
      required: true, 
      enum: ["best_constructed_monthly", "best_draft_monthly", "hall_of_fame"] 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, required: true },
    month: { type: String }, // Format: "YYYY-MM"
    year: { type: Number },
    awardedAt: { type: Date, required: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
BadgeSchema.index({ type: 1, month: 1 });
BadgeSchema.index({ type: 1, year: 1 });

// Export the model
export const BadgeModel = mongoose.models.Badge || mongoose.model<BadgeDocument>("Badge", BadgeSchema);

// Helper function to convert between MongoDB document and our Badge type
export function convertDocumentToBadge(doc: BadgeDocument): BadgeType {
  const badge = doc.toObject();
  return {
    _id: badge._id,
    type: badge.type,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    color: badge.color,
    month: badge.month,
    year: badge.year,
    awardedAt: badge.awardedAt,
    createdAt: badge.createdAt,
  };
}

// Helper function to convert our Badge type to a MongoDB document
export function convertBadgeToDocument(
  badge: Partial<BadgeType>
): Partial<BadgeDocument> {
  return {
    type: badge.type,
    title: badge.title,
    description: badge.description,
    icon: badge.icon,
    color: badge.color,
    month: badge.month,
    year: badge.year,
    awardedAt: badge.awardedAt,
  };
}
