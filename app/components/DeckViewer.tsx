"use client";

import { useState } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import Image from "next/image";
import { PlusIcon, MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  ViewColumnsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ArrowsUpDownIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import CardHoverPreview from "./CardHoverPreview";

interface DeckViewerProps {
  cards: Card[];
  deckCards: DeckCard[];
  onAddCard: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onRemoveAllCopies: (cardId: string) => void;
}

type ViewMode = "list" | "compact" | "large";
type SortMode = "default" | "mana" | "attack" | "defense";

export default function DeckViewer({
  cards,
  deckCards,
  onAddCard,
  onRemoveCard,
  onRemoveAllCopies,
}: DeckViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  // Function to sort cards based on the current sort mode
  const sortCards = (
    a: { card: Card; quantity: number },
    b: { card: Card; quantity: number }
  ) => {
    switch (sortMode) {
      case "mana":
        return a.card.manaCost - b.card.manaCost;
      case "attack":
        return (a.card.stats?.power || 0) - (b.card.stats?.power || 0);
      case "defense":
        return (a.card.stats?.defense || 0) - (b.card.stats?.defense || 0);
      default:
        return a.card.manaCost - b.card.manaCost; // Default sort by mana cost
    }
  };

  // Prepare cards based on sort mode
  let preparedCards: { card: Card; quantity: number }[] = [];

  // Map deck cards to actual cards
  deckCards.forEach((deckCard) => {
    const card = cards.find((c) => c.id === deckCard.cardId);
    if (card) {
      preparedCards.push({ card, quantity: deckCard.quantity });
    }
  });

  // Sort all cards if not in default mode
  if (sortMode !== "default") {
    preparedCards.sort(sortCards);
  }

  // Group cards by type for default view
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};

  if (sortMode === "default") {
    // Group by type for default view
    deckCards.forEach((deckCard) => {
      const card = cards.find((c) => c.id === deckCard.cardId);
      if (card) {
        const type = card.typeAndAttributes.mainType;
        if (!groupedCards[type]) {
          groupedCards[type] = [];
        }
        groupedCards[type].push({ card, quantity: deckCard.quantity });
      }
    });
  } else {
    // For other sort modes, create a single group called "Cards"
    groupedCards["Cards"] = preparedCards;
  }

  // Sort card types
  const sortedTypes = Object.keys(groupedCards).sort();

  // Calculate total cards
  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <section
      className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4 mt-6'
      aria-labelledby='deck-viewer-heading'>
      <div className='flex flex-col space-y-3 mb-4'>
        <div className='flex justify-between items-center'>
          <h3
            id='deck-viewer-heading'
            className='text-lg font-semibold text-white'>
            Deck ({totalCards} cards)
          </h3>
          <div
            className='flex space-x-2'
            role='toolbar'
            aria-label='View options'>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-algomancy-purple text-white"
                  : "bg-algomancy-dark text-gray-400 hover:text-white"
              }`}
              title='List View'
              aria-label='List View'
              aria-pressed={viewMode === "list"}>
              <ListBulletIcon className='w-5 h-5' aria-hidden='true' />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-2 rounded ${
                viewMode === "compact"
                  ? "bg-algomancy-purple text-white"
                  : "bg-algomancy-dark text-gray-400 hover:text-white"
              }`}
              title='Compact Grid View'
              aria-label='Compact Grid View'
              aria-pressed={viewMode === "compact"}>
              <Squares2X2Icon className='w-5 h-5' aria-hidden='true' />
            </button>
            <button
              onClick={() => setViewMode("large")}
              className={`p-2 rounded ${
                viewMode === "large"
                  ? "bg-algomancy-purple text-white"
                  : "bg-algomancy-dark text-gray-400 hover:text-white"
              }`}
              title='Large Grid View'
              aria-label='Large Grid View'
              aria-pressed={viewMode === "large"}>
              <ViewColumnsIcon className='w-5 h-5' aria-hidden='true' />
            </button>
          </div>
        </div>

        <div className='flex justify-end'>
          <div
            className='flex space-x-1 bg-algomancy-dark rounded-lg p-1'
            role='toolbar'
            aria-label='Sort options'>
            <button
              onClick={() => setSortMode("default")}
              className={`px-3 py-1.5 rounded flex items-center space-x-1 text-xs ${
                sortMode === "default"
                  ? "bg-algomancy-purple text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title='Default Sort (By Type)'
              aria-label='Default Sort (By Type)'
              aria-pressed={sortMode === "default"}>
              <span>Default</span>
            </button>
            <button
              onClick={() => setSortMode("mana")}
              className={`px-3 py-1.5 rounded flex items-center space-x-1 text-xs ${
                sortMode === "mana"
                  ? "bg-algomancy-purple text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title='Sort by Mana Cost'
              aria-label='Sort by Mana Cost'
              aria-pressed={sortMode === "mana"}>
              <ArrowsUpDownIcon className='w-3 h-3' aria-hidden='true' />
              <span>Mana</span>
            </button>
            <button
              onClick={() => setSortMode("attack")}
              className={`px-3 py-1.5 rounded flex items-center space-x-1 text-xs ${
                sortMode === "attack"
                  ? "bg-algomancy-purple text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title='Sort by Power'
              aria-label='Sort by Power'
              aria-pressed={sortMode === "attack"}>
              <BoltIcon className='w-3 h-3' aria-hidden='true' />
              <span>Power</span>
            </button>
            <button
              onClick={() => setSortMode("defense")}
              className={`px-3 py-1.5 rounded flex items-center space-x-1 text-xs ${
                sortMode === "defense"
                  ? "bg-algomancy-purple text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title='Sort by Defense'
              aria-label='Sort by Defense'
              aria-pressed={sortMode === "defense"}>
              <ShieldCheckIcon className='w-3 h-3' aria-hidden='true' />
              <span>Defense</span>
            </button>
          </div>
        </div>
      </div>

      {totalCards === 0 ? (
        <div className='text-center py-8 text-gray-400' aria-live='polite'>
          <p>Your deck is empty.</p>
          <p className='text-sm mt-2'>Add cards from the card browser above.</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {sortedTypes.map((type) => (
            <div key={type} className='space-y-2'>
              <h4
                className='text-sm font-medium text-algomancy-gold border-b border-algomancy-gold/30 pb-1'
                id={`deck-section-${type.toLowerCase().replace(/\s+/g, "-")}`}>
                {type} (
                {groupedCards[type].reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
                )
              </h4>

              {/* List View */}
              {viewMode === "list" && (
                <div
                  className='space-y-1'
                  aria-labelledby={`deck-section-${type
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  role='list'>
                  {groupedCards[type]
                    .sort((a, b) => a.card.manaCost - b.card.manaCost)
                    .map(({ card, quantity }) => (
                      <div
                        key={card.id}
                        className='flex items-center justify-between py-1 px-2 hover:bg-algomancy-purple/10 rounded'
                        role='listitem'>
                        <div className='flex items-center space-x-2'>
                          <CardHoverPreview card={card}>
                            <div className='w-6 h-6 flex-shrink-0 relative'>
                              <Image
                                src={card.imageUrl}
                                alt={`${card.name} card`}
                                fill
                                className='object-cover rounded'
                              />
                            </div>
                          </CardHoverPreview>
                          <span className='text-sm text-white truncate max-w-[150px]'>
                            {card.name}
                          </span>
                        </div>
                        <div className='flex items-center space-x-1'>
                          <button
                            onClick={() => onRemoveCard(card.id)}
                            className='p-1 text-gray-400 hover:text-white'
                            title='Remove one copy'
                            aria-label={`Remove one copy of ${card.name}`}>
                            <MinusIcon className='w-4 h-4' aria-hidden='true' />
                          </button>
                          <span
                            className='text-sm text-white w-5 text-center'
                            aria-label={`${quantity} copies`}>
                            {quantity}
                          </span>
                          <button
                            onClick={() => onAddCard(card.id)}
                            className='p-1 text-gray-400 hover:text-white'
                            title='Add one copy'
                            aria-label={`Add one copy of ${card.name}`}>
                            <PlusIcon className='w-4 h-4' aria-hidden='true' />
                          </button>
                          <button
                            onClick={() => onRemoveAllCopies(card.id)}
                            className='p-1 text-gray-400 hover:text-white ml-1'
                            title='Remove all copies'
                            aria-label={`Remove all copies of ${card.name}`}>
                            <XMarkIcon className='w-4 h-4' aria-hidden='true' />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Compact Grid View */}
              {viewMode === "compact" && (
                <div
                  className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                  aria-labelledby={`deck-section-${type
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  role='grid'>
                  {groupedCards[type]
                    .sort((a, b) => a.card.manaCost - b.card.manaCost)
                    .map(({ card }) => (
                      <CardHoverPreview
                        key={card.id}
                        card={card}
                        onClick={() => onAddCard(card.id)}>
                        <div
                          className='relative group cursor-pointer'
                          role='gridcell'
                          aria-label={`${card.name} card`}>
                          <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                            <Image
                              src={card.imageUrl}
                              alt={`${card.name} card`}
                              fill
                              className='object-cover'
                              sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                            />
                          </div>

                          <div className='absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveCard(card.id);
                              }}
                              className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                              title='Remove one copy'
                              aria-label={`Remove one copy of ${card.name}`}>
                              <MinusIcon
                                className='w-4 h-4'
                                aria-hidden='true'
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddCard(card.id);
                              }}
                              className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                              title='Add one copy'
                              aria-label={`Add one copy of ${card.name}`}>
                              <PlusIcon
                                className='w-4 h-4'
                                aria-hidden='true'
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveAllCopies(card.id);
                              }}
                              className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                              title='Remove all copies'
                              aria-label={`Remove all copies of ${card.name}`}>
                              <XMarkIcon
                                className='w-4 h-4'
                                aria-hidden='true'
                              />
                            </button>
                          </div>
                        </div>
                      </CardHoverPreview>
                    ))}
                </div>
              )}

              {/* Large Grid View */}
              {viewMode === "large" && (
                <div
                  className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                  aria-labelledby={`deck-section-${type
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  role='grid'>
                  {groupedCards[type]
                    .sort((a, b) => a.card.manaCost - b.card.manaCost)
                    .map(({ card }) => (
                      <div
                        key={card.id}
                        className='relative group cursor-pointer'
                        onClick={() => onAddCard(card.id)}
                        role='gridcell'
                        aria-label={`${card.name} card`}>
                        <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                          <Image
                            src={card.imageUrl}
                            alt={`${card.name} card`}
                            fill
                            className='object-cover'
                            sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                          />
                        </div>

                        <div className='absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCard(card.id);
                            }}
                            className='p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Remove one copy'
                            aria-label={`Remove one copy of ${card.name}`}>
                            <MinusIcon className='w-5 h-5' aria-hidden='true' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddCard(card.id);
                            }}
                            className='p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Add one copy'
                            aria-label={`Add one copy of ${card.name}`}>
                            <PlusIcon className='w-5 h-5' aria-hidden='true' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveAllCopies(card.id);
                            }}
                            className='p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Remove all copies'
                            aria-label={`Remove all copies of ${card.name}`}>
                            <XMarkIcon className='w-5 h-5' aria-hidden='true' />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
