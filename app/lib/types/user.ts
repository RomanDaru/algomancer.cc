import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
  username?: string; // Added username field
  email: string;
  hashedPassword?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deck {
  _id: ObjectId;
  name: string;
  description?: string;
  userId: ObjectId;
  cards: DeckCard[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  views: number;
  viewedBy: string[];
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}
