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
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    emailVerified: { type: Date }, // For NextAuth compatibility
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    resetToken: user.resetToken,
    resetTokenExpiry: user.resetTokenExpiry,
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
    resetToken: user.resetToken,
    resetTokenExpiry: user.resetTokenExpiry,
  };
}
