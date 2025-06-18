import mongoose, { Schema, Document } from "mongoose";
import { UserBadge as UserBadgeType } from "../../types/user";

// Interface for the MongoDB document
export interface UserBadgeDocument extends Document, Omit<UserBadgeType, "_id"> {
  // MongoDB adds _id automatically
}

// Main UserBadge schema
const UserBadgeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    badgeId: { type: Schema.Types.ObjectId, required: true, ref: "Badge" },
    competitionId: { type: Schema.Types.ObjectId, ref: "Competition" },
    awardedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
UserBadgeSchema.index({ userId: 1 });
UserBadgeSchema.index({ badgeId: 1 });
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true }); // Prevent duplicate badges

// Export the model
export const UserBadgeModel = mongoose.models.UserBadge || mongoose.model<UserBadgeDocument>("UserBadge", UserBadgeSchema);

// Helper function to convert between MongoDB document and our UserBadge type
export function convertDocumentToUserBadge(doc: UserBadgeDocument): UserBadgeType {
  const userBadge = doc.toObject();
  return {
    _id: userBadge._id,
    userId: userBadge.userId,
    badgeId: userBadge.badgeId,
    competitionId: userBadge.competitionId,
    awardedAt: userBadge.awardedAt,
    badge: userBadge.badge, // Will be populated if needed
  };
}

// Helper function to convert our UserBadge type to a MongoDB document
export function convertUserBadgeToDocument(
  userBadge: Partial<UserBadgeType>
): Partial<UserBadgeDocument> {
  return {
    userId: userBadge.userId,
    badgeId: userBadge.badgeId,
    competitionId: userBadge.competitionId,
    awardedAt: userBadge.awardedAt,
  };
}
