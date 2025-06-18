"use client";

import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PlayIcon } from "@heroicons/react/24/solid";
import ElementIcons from "./ElementIcons";
import LikeButton from "./LikeButton";
import {
  ElementType,
  generateElementGradient,
  getAllDeckElements,
} from "@/app/lib/utils/elements";

interface DeckCardProps {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
  cards?: Card[];
  className?: string;
  isLikedByCurrentUser?: boolean; // 🎯 NEW: Like status from optimized API
}

export default function DeckCard({
  deck,
  user,
  cards,
  className = "",
  isLikedByCurrentUser, // 🎯 NEW: Receive like status
}: DeckCardProps) {
  // Calculate total cards
  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);

  // Determine deck elements (placeholder until we have actual card data)
  let deckElements: ElementType[] = ["Colorless"];

  // Determine deck elements based on the cards in the deck
  if (cards && cards.length > 0 && deck.cards.length > 0) {
    // Create an array of card objects with quantities for element calculation
    const cardsWithQuantities = deck.cards
      .map((deckCard) => {
        const card = cards.find((c) => c.id === deckCard.cardId);
        return {
          card,
          quantity: deckCard.quantity,
        };
      })
      .filter((item) => item.card !== undefined) as {
      card: Card;
      quantity: number;
    }[];

    // Get ALL elements in the deck
    if (cardsWithQuantities.length > 0) {
      deckElements = getAllDeckElements(cardsWithQuantities);
    }
  } else {
    // Fallback: Use the deck ID for consistent colors when card data isn't available
    // Convert the deck ID to a number for consistent element selection
    const idSum = deck._id
      .toString()
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // Use the ID to select elements deterministically
    const allElements: ElementType[] = [
      "Fire",
      "Water",
      "Earth",
      "Wood",
      "Metal",
    ];

    // For mono-element decks (if the deck name contains an element name)
    const deckName = deck.name.toLowerCase();
    if (deckName.includes("fire")) {
      deckElements = ["Fire"];
    } else if (deckName.includes("water")) {
      deckElements = ["Water"];
    } else if (deckName.includes("earth")) {
      deckElements = ["Earth"];
    } else if (deckName.includes("wood") || deckName.includes("forest")) {
      deckElements = ["Wood"];
    } else if (deckName.includes("metal")) {
      deckElements = ["Metal"];
    } else {
      // For other decks, use the ID to select 1-2 elements
      const primaryElementIndex = idSum % allElements.length;
      deckElements = [allElements[primaryElementIndex]];

      // 50% chance of being a dual-element deck
      if (idSum % 2 === 0) {
        const secondaryElementIndex = (idSum + 1) % allElements.length;
        if (secondaryElementIndex !== primaryElementIndex) {
          deckElements.push(allElements[secondaryElementIndex]);
        }
      }
    }
  }

  // Generate gradient based on deck elements - use non-vibrant colors to match deck detail page
  const gradientStyle = {
    background: generateElementGradient(deckElements, "135deg", false),
  };

  return (
    <Link
      href={`/decks/${deck._id.toString()}`}
      className={`block ${className}`}>
      <div className='relative rounded-lg overflow-hidden h-full bg-algomancy-darker border border-algomancy-purple/30 hover:border-algomancy-purple transition-colors group'>
        {/* Element gradient background with opacity to match deck detail page */}
        <div
          className='absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity'
          style={gradientStyle}
        />

        <div className='relative p-5 z-10 h-full flex flex-col'>
          {/* Top section */}
          <div>
            <div className='flex justify-between items-start'>
              <h2 className='text-white text-lg font-medium'>{deck.name}</h2>
              <ElementIcons
                elements={deckElements}
                size={20}
                className='ml-2'
                showTooltips={true}
              />
            </div>

            {deck.description && (
              <p className='text-white/80 text-sm mt-2 line-clamp-2'>
                {deck.description}
              </p>
            )}
          </div>

          {/* Spacer to push bottom section down */}
          <div className='flex-grow'></div>

          {/* Bottom section - maintains original spacing but positioned at bottom */}
          <div className='mt-6'>
            <div className='flex justify-between items-center text-sm'>
              <div className='flex items-center space-x-4'>
                <span className='text-white'>{totalCards} cards</span>
                <span
                  className='text-white/80 flex items-center'
                  title={`${deck.views || 0} views`}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 mr-1'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                  {typeof deck.views === "number" ? deck.views : 0}
                </span>
                <div onClick={(e) => e.preventDefault()}>
                  <LikeButton
                    deckId={deck._id.toString()}
                    initialLikes={deck.likes || 0}
                    initialLiked={isLikedByCurrentUser} // 🎯 NEW: Pass optimized like status
                    size='sm'
                    showCount={true}
                  />
                </div>
              </div>
              <span className='text-white/80'>
                {formatDistanceToNow(new Date(deck.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className='flex items-center justify-between mt-2 text-sm'>
              <div className='flex items-center'>
                <span className='text-white/80'>By </span>
                {user.username ? (
                  <span className='text-white ml-1'>@{user.username}</span>
                ) : (
                  <span className='text-white/80 ml-1'>
                    {user.name || "Unknown User"}
                  </span>
                )}
              </div>

              {/* YouTube video indicator - same row as username */}
              {deck.youtubeUrl && (
                <div
                  className='bg-red-600 rounded-full p-1 shadow-sm'
                  title='Has video showcase'>
                  <PlayIcon className='w-3 h-3 text-white' />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Import here to avoid circular dependency
import { getDeckElements } from "@/app/lib/utils/elements";
