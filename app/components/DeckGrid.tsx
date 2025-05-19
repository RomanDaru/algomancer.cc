"use client";

import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import DeckCard from "./DeckCard";
import Link from "next/link";

interface DeckGridProps {
  decks: Deck[];
  cards?: Card[];
  users?: {
    [key: string]: {
      name: string;
      username: string | null;
    };
  };
  user?: {
    name: string;
    username: string | null;
  };
  emptyMessage?: string;
  createDeckLink?: string;
  createDeckText?: string;
  viewAllLink?: string;
  viewAllText?: string;
  maxDisplay?: number;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export default function DeckGrid({
  decks,
  cards,
  users,
  user,
  emptyMessage = "No decks found",
  createDeckLink,
  createDeckText = "Create Deck",
  viewAllLink,
  viewAllText,
  maxDisplay,
  columns = {
    sm: 1,
    md: 2,
    lg: 2,
    xl: 3,
  },
  className = "",
}: DeckGridProps) {
  // If maxDisplay is set, limit the number of decks shown
  const displayDecks = maxDisplay ? decks.slice(0, maxDisplay) : decks;
  const hasMore = maxDisplay && decks.length > maxDisplay;

  // Generate column classes based on the columns prop
  const columnClasses = [
    `grid-cols-1`,
    columns.sm ? `sm:grid-cols-${columns.sm}` : "",
    columns.md ? `md:grid-cols-${columns.md}` : "",
    columns.lg ? `lg:grid-cols-${columns.lg}` : "",
    columns.xl ? `xl:grid-cols-${columns.xl}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (decks.length === 0) {
    return (
      <div className='text-center py-8 text-gray-400'>
        <p>{emptyMessage}</p>
        {createDeckLink && (
          <Link
            href={createDeckLink}
            className='mt-4 inline-block px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
            {createDeckText}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`grid ${columnClasses} gap-8`}>
        {displayDecks.map((deck) => {
          // Determine which user to use for this deck
          let deckUser = user;

          // If we have a users map and this deck's user is in it, use that
          if (users && deck.userId && users[deck.userId]) {
            deckUser = users[deck.userId];
          }

          return (
            <DeckCard
              key={deck._id.toString()}
              deck={deck}
              user={deckUser || { name: "Unknown", username: null }}
              cards={cards}
            />
          );
        })}
      </div>

      {hasMore && viewAllLink && (
        <div className='mt-4 text-center'>
          <Link
            href={viewAllLink}
            className='text-sm text-algomancy-purple hover:text-algomancy-gold'>
            {viewAllText || `View all ${decks.length} decks`}
          </Link>
        </div>
      )}
    </div>
  );
}
