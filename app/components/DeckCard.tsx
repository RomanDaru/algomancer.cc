"use client";

import { Deck } from "@/app/lib/types/user";
import { Card } from "@/app/lib/types/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ElementIcons from "./ElementIcons";
import { ElementType, generateElementGradient } from "@/app/lib/utils/elements";

interface DeckCardProps {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
  cards?: Card[];
  className?: string;
}

export default function DeckCard({
  deck,
  user,
  cards,
  className = "",
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

    // Get the dominant elements (max 3)
    if (cardsWithQuantities.length > 0) {
      deckElements = getDeckElements(cardsWithQuantities, 3);
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

        <div className='relative p-5 z-10'>
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

          <div className='flex justify-between items-center mt-6 text-sm'>
            <div className='flex items-center'>
              <span className='text-white'>{totalCards} cards</span>
            </div>
            <span className='text-white/80'>
              {formatDistanceToNow(new Date(deck.updatedAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div className='flex items-center mt-2 text-sm'>
            <span className='text-white/80'>By </span>
            {user.username ? (
              <span className='text-white ml-1'>@{user.username}</span>
            ) : (
              <span className='text-white/80 ml-1'>
                {user.name || "Unknown User"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Import here to avoid circular dependency
import { getDeckElements } from "@/app/lib/utils/elements";
