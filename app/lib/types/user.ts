import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  name: string;
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
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}
