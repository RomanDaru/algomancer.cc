import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  username?: string; // Added username field
  email: string;
  hashedPassword?: string;
  image?: string;
  isAdmin?: boolean; // Admin role for competition management
  createdAt: Date;
  updatedAt: Date;
  resetToken?: string; // Password reset token
  resetTokenExpiry?: Date; // Password reset token expiry
}

export interface Deck {
  _id: ObjectId;
  name: string;
  description?: string;
  youtubeUrl?: string; // YouTube video URL for deck showcase
  userId: ObjectId;
  cards: DeckCard[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  views: number;
  viewedBy: string[];
  likes: number;
  likedBy: ObjectId[];
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}

export interface Competition {
  _id: ObjectId;
  title: string;
  description: string;
  type: "constructed" | "draft";
  status: "upcoming" | "active" | "voting" | "completed";
  startDate: Date;
  endDate: Date;
  votingEndDate: Date;
  discordChannelId?: string;
  submissionCount: number;
  winners: CompetitionWinner[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitionWinner {
  place: 1 | 2 | 3;
  deckId: ObjectId;
  userId: ObjectId;
  votes?: number;
  // Populated user data (when fetched with user info)
  user?: {
    _id: ObjectId;
    name: string;
    email: string;
    username?: string;
  };
  // Populated deck data (when fetched with deck info)
  deck?: {
    _id: ObjectId;
    name: string;
    description?: string;
  };
}

export interface CompetitionEntry {
  _id: ObjectId;
  competitionId: ObjectId;
  deckId: ObjectId;
  userId: ObjectId;
  submittedAt: Date;
  discordMessageId?: string;
}

export interface Badge {
  _id: ObjectId;
  type: "best_constructed_monthly" | "best_draft_monthly" | "hall_of_fame";
  title: string;
  description: string;
  icon: string; // Emoji or icon identifier
  color: string; // CSS color for the badge
  month?: string; // Format: "YYYY-MM" for monthly badges
  year?: number; // For yearly or special badges
  awardedAt: Date;
  createdAt: Date;
}

export interface UserBadge {
  _id: ObjectId;
  userId: ObjectId;
  badgeId: ObjectId;
  competitionId?: ObjectId; // Competition that earned this badge
  awardedAt: Date;
  // Populated badge data
  badge?: Badge;
}
