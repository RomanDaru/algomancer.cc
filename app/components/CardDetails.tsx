"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card as CardType } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import { formatDistanceToNow } from "date-fns";
import ElementIcons from "./ElementIcons";
import {
  ElementType,
  getDeckElements,
  generateElementGradient,
} from "@/app/lib/utils/elements";

interface CardDetailsProps {
  card: CardType;
  onClose?: () => void;
}

interface DeckWithUserAndCards {
  deck: Deck;
  user: {
    name: string;
    username: string | null;
  };
  cards: Card[];
}

export default function CardDetails({ card, onClose }: CardDetailsProps) {
  const [decksWithCard, setDecksWithCard] = useState<DeckWithUserAndCards[]>(
    []
  );
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);

  // Fetch decks containing this card
  useEffect(() => {
    async function fetchDecksWithCard() {
      setIsLoadingDecks(true);
      setDeckError(null);

      try {
        const response = await fetch(`/api/decks/card/${card.id}?limit=3`);

        if (!response.ok) {
          throw new Error("Failed to fetch decks containing this card");
        }

        const data = await response.json();
        setDecksWithCard(data);
      } catch (error) {
        console.error("Error fetching decks:", error);
        setDeckError(
          error instanceof Error ? error.message : "An error occurred"
        );
      } finally {
        setIsLoadingDecks(false);
      }
    }

    fetchDecksWithCard();
  }, [card.id]);
  return (
    <div className='flex flex-col md:flex-row gap-6'>
      {/* Close button */}
      {onClose && (
        <button
          className='absolute top-4 right-4 text-gray-400 hover:text-white bg-algomancy-purple/20 hover:bg-algomancy-purple/40 rounded-full p-2 transition-colors z-10'
          onClick={onClose}>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
          <span className='sr-only'>Close</span>
        </button>
      )}

      {/* Card Image */}
      <div className='relative w-full md:w-1/2 aspect-[2/3]'>
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className='object-cover rounded-lg'
          sizes='(max-width: 768px) 100vw, 50vw'
        />
      </div>

      {/* Card Details */}
      <div className='w-full md:w-1/2'>
        <h2 className='text-2xl font-bold text-algomancy-gold mb-2'>
          {card.name}
        </h2>

        <div className='grid grid-cols-2 gap-4 mt-4'>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>
              Mana Cost
            </h3>
            <p className='text-white'>
              {/* Display X instead of 0 for Spell cards with 0 mana cost, but not for tokens */}
              {card.manaCost === 0 &&
              card.typeAndAttributes.mainType === "Spell" &&
              !card.typeAndAttributes.subType.toLowerCase().includes("token")
                ? "X"
                : card.manaCost}
            </p>
          </div>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Element</h3>
            <p>{card.element.type}</p>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-4'>
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Type</h3>
            <p>
              {card.typeAndAttributes.subType} {card.typeAndAttributes.mainType}
            </p>
          </div>
          {/* Only show Power/Defense stats for non-Spell cards */}
          {!card.typeAndAttributes.mainType.includes("Spell") && (
            <div>
              <h3 className='font-semibold text-algomancy-blue-light'>Stats</h3>
              <p>
                Power: {card.stats.power} / Defense: {card.stats.defense}
              </p>
            </div>
          )}
          <div>
            <h3 className='font-semibold text-algomancy-blue-light'>Timing</h3>
            <p>{card.timing.type}</p>
          </div>
        </div>

        <div className='mt-4'>
          <h3 className='font-semibold text-algomancy-blue-light'>Abilities</h3>
          <ul className='list-disc pl-5'>
            {card.abilities.map((ability, index) => (
              <li key={index}>{ability}</li>
            ))}
          </ul>
        </div>

        {card.flavorText && (
          <div className='mt-4'>
            <h3 className='font-semibold text-algomancy-blue-light'>
              Flavor Text
            </h3>
            <p className='italic text-algomancy-gold-light'>
              {card.flavorText}
            </p>
          </div>
        )}

        <div className='mt-4'>
          <h3 className='font-semibold text-algomancy-blue-light'>Set</h3>
          <p>
            {card.set.name} ({card.set.complexity})
          </p>
        </div>

        {/* Decks containing this card */}
        <div className='mt-6 pt-4 border-t border-algomancy-purple/30'>
          <h3 className='font-semibold text-algomancy-blue-light mb-3'>
            Popular Decks with this Card
          </h3>

          {isLoadingDecks ? (
            <div className='text-center py-3'>
              <p className='text-gray-400'>Loading decks...</p>
            </div>
          ) : deckError ? (
            <div className='text-center py-3'>
              <p className='text-red-400'>{deckError}</p>
            </div>
          ) : decksWithCard.length === 0 ? (
            <div className='text-center py-3 space-y-4'>
              <p className='text-gray-400'>
                No public decks found with this card.
              </p>
              <Link
                href={`/decks/create?card=${card.id}`}
                className='inline-block px-4 py-2 bg-algomancy-purple/30 hover:bg-algomancy-purple/50 text-white rounded-md transition-colors'>
                Create a deck with this card
              </Link>
            </div>
          ) : (
            <div className='space-y-3'>
              {decksWithCard.map(({ deck, user, cards }) => {
                // Determine deck elements based on the cards in the deck
                let deckElements: ElementType[] = ["Colorless"];

                if (cards && cards.length > 0 && deck.cards.length > 0) {
                  // Create an array of card objects with quantities for element calculation
                  const cardsWithQuantities = deck.cards
                    .map((deckCard) => {
                      const cardObj = cards.find(
                        (c) => c.id === deckCard.cardId
                      );
                      return {
                        card: cardObj,
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
                  } else if (
                    deckName.includes("wood") ||
                    deckName.includes("forest")
                  ) {
                    deckElements = ["Wood"];
                  } else if (deckName.includes("metal")) {
                    deckElements = ["Metal"];
                  } else {
                    // For other decks, use the ID to select 1-2 elements
                    const primaryElementIndex = idSum % allElements.length;
                    deckElements = [allElements[primaryElementIndex]];

                    // 50% chance of being a dual-element deck
                    if (idSum % 2 === 0) {
                      const secondaryElementIndex =
                        (idSum + 1) % allElements.length;
                      if (secondaryElementIndex !== primaryElementIndex) {
                        deckElements.push(allElements[secondaryElementIndex]);
                      }
                    }
                  }
                }

                // Generate gradient based on deck elements
                const gradientStyle = {
                  background: generateElementGradient(
                    deckElements,
                    "135deg",
                    false
                  ),
                };

                return (
                  <Link
                    key={deck._id.toString()}
                    href={`/decks/${deck._id.toString()}`}
                    className='block relative rounded-md overflow-hidden border border-algomancy-purple/30 hover:border-algomancy-purple transition-colors group'>
                    {/* Element gradient background with opacity */}
                    <div
                      className='absolute inset-0 opacity-30 group-hover:opacity-40 transition-opacity'
                      style={gradientStyle}
                    />
                    <div className='relative p-3 z-10'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <div className='flex items-center'>
                            <h4 className='text-white font-medium'>
                              {deck.name}
                            </h4>
                            <ElementIcons
                              elements={deckElements}
                              size={16}
                              className='ml-2'
                              showTooltips={true}
                            />
                          </div>
                          <div className='text-sm text-algomancy-gold mt-1'>
                            {user.username ? (
                              <>@{user.username}</>
                            ) : (
                              <span className='text-gray-400'>{user.name}</span>
                            )}
                            <span className='text-gray-500 text-xs ml-2'>
                              •{" "}
                              {formatDistanceToNow(new Date(deck.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className='flex flex-col items-end'>
                          <div className='text-sm text-white'>
                            {deck.cards.reduce(
                              (sum, card) => sum + card.quantity,
                              0
                            )}{" "}
                            cards
                          </div>
                          <div className='text-xs text-white/80 flex items-center mt-1'>
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-3 w-3 mr-1'
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
                            {typeof deck.views === "number" ? deck.views : 0}{" "}
                            views
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              <div className='text-center mt-4'>
                <Link
                  href={`/decks?card=${card.id}`}
                  className='text-sm text-algomancy-purple hover:text-algomancy-gold'>
                  View all decks with this card
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
