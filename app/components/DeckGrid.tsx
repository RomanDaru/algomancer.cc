"use client";

import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import DeckCard from "./DeckCard";
import Link from "next/link";

interface DeckGridProps {
  // Option 1: Traditional format (backward compatibility)
  decks?: Deck[];
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

  // Option 2: Optimized format with like status
  decksWithUserInfo?: Array<{
    deck: Deck;
    user: { name: string; username: string | null };
    isLikedByCurrentUser: boolean;
    deckElements?: string[];
  }>;

  emptyMessage?: string;
  emptyAction?: {
    text: string;
    link: string;
  };
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
  decksWithUserInfo, // 🎯 NEW: Optimized format
  emptyMessage = "No decks found",
  emptyAction,
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
  // 🎯 NEW: Handle both formats - prioritize optimized format
  const useOptimizedFormat = decksWithUserInfo && decksWithUserInfo.length > 0;
  const dataSource = useOptimizedFormat ? decksWithUserInfo : decks || [];

  // If maxDisplay is set, limit the number of items shown
  const displayItems = maxDisplay
    ? dataSource.slice(0, maxDisplay)
    : dataSource;
  const hasMore = maxDisplay && dataSource.length > maxDisplay;

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

  if (dataSource.length === 0) {
    return (
      <div className='text-center py-8 text-gray-400'>
        <p>{emptyMessage}</p>
        <div className='mt-4 space-y-3'>
          {emptyAction && (
            <Link
              href={emptyAction.link}
              className='inline-block px-4 py-2 text-sm rounded-md bg-algomancy-purple/30 hover:bg-algomancy-purple/50 text-white transition-colors'>
              {emptyAction.text}
            </Link>
          )}
          {createDeckLink && (
            <div className={emptyAction ? "mt-2" : ""}>
              <Link
                href={createDeckLink}
                className='inline-block px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                {createDeckText}
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`grid ${columnClasses} gap-8`}>
        {displayItems.map((item) => {
          if (useOptimizedFormat) {
            // 🎯 NEW: Optimized format with like status
            const {
              deck,
              user: itemUser,
              isLikedByCurrentUser,
              deckElements,
            } = item as {
              deck: Deck;
              user: { name: string; username: string | null };
              isLikedByCurrentUser: boolean;
              deckElements?: string[];
            };

            return (
              <DeckCard
                key={deck._id.toString()}
                deck={deck}
                user={itemUser}
                cards={cards}
                deckElements={deckElements}
                isLikedByCurrentUser={isLikedByCurrentUser} // 🎯 Pass optimized like status
              />
            );
          } else {
            // Traditional format (backward compatibility)
            const deck = item as Deck;
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
                // isLikedByCurrentUser is undefined, so LikeButton will fetch it
              />
            );
          }
        })}
      </div>

      {hasMore && viewAllLink && (
        <div className='mt-4 text-center'>
          <Link
            href={viewAllLink}
            className='text-sm text-algomancy-purple hover:text-algomancy-gold'>
            {viewAllText || `View all ${dataSource.length} decks`}
          </Link>
        </div>
      )}
    </div>
  );
}
