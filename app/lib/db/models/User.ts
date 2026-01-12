import mongoose, { Schema, Document } from "mongoose";
import { User as UserType } from "../../types/user";

// Interface for the MongoDB document
export interface UserDocument extends Document, Omit<UserType, "_id"> {
  // MongoDB adds _id automatically
}

// Main User schema
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String },
    email: { type: String, required: true, unique: true },
    hashedPassword: { type: String },
    image: { type: String },
    isAdmin: { type: Boolean, default: false },
    includePrivateLogsInCommunityStats: { type: Boolean, default: false },
    achievementXp: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    emailVerified: { type: Date }, // For NextAuth compatibility
    emailVerificationToken: { type: String },
    emailVerificationTokenExpiry: { type: Date },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });

// Export the model
export const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

// Helper function to convert between MongoDB document and our User type
export function convertDocumentToUser(doc: UserDocument): UserType {
  const user = doc.toObject();
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    hashedPassword: user.hashedPassword,
    image: user.image,
    isAdmin: user.isAdmin || false,
    includePrivateLogsInCommunityStats:
      user.includePrivateLogsInCommunityStats || false,
    achievementXp: typeof user.achievementXp === "number" ? user.achievementXp : 0,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    resetToken: user.resetToken,
    resetTokenExpiry: user.resetTokenExpiry,
    emailVerified: user.emailVerified,
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationTokenExpiry: user.emailVerificationTokenExpiry,
  };
}

// Helper function to convert our User type to a MongoDB document
export function convertUserToDocument(
  user: Partial<UserType>
): Partial<UserDocument> {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    hashedPassword: user.hashedPassword,
    image: user.image,
    isAdmin: user.isAdmin,
    includePrivateLogsInCommunityStats: user.includePrivateLogsInCommunityStats,
    achievementXp: user.achievementXp,
    resetToken: user.resetToken,
    resetTokenExpiry: user.resetTokenExpiry,
    emailVerified: user.emailVerified,
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationTokenExpiry: user.emailVerificationTokenExpiry,
  };
}
