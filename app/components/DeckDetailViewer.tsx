"use client";

import { useState } from "react";
import { Card } from "@/app/lib/types/card";
import Image from "next/image";
import {
  ViewColumnsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ArrowsUpDownIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import CardHoverPreview from "./CardHoverPreview";

interface DeckDetailViewerProps {
  cards: Card[];
  groupedCards: Record<string, { card: Card; quantity: number }[]>;
  totalCards: number;
}

type ViewMode = "list" | "compact" | "large";
type SortMode = "default" | "mana" | "attack" | "defense";

export default function DeckDetailViewer({
  cards,
  groupedCards,
  totalCards,
}: DeckDetailViewerProps) {
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

  // Flatten the grouped cards
  Object.values(groupedCards).forEach((cardGroup) => {
    preparedCards = [...preparedCards, ...cardGroup];
  });

  // Sort card types
  const sortedTypes = Object.keys(groupedCards).sort();

  // Create a new grouped cards object for non-default sort modes
  let displayedGroupedCards = groupedCards;

  if (sortMode !== "default") {
    // For other sort modes, create a single group called "Cards"
    const sortedCards = [...preparedCards].sort(sortCards);
    displayedGroupedCards = { Cards: sortedCards };
  }

  // Get the types to display based on sort mode
  const displayedTypes = sortMode === "default" ? sortedTypes : ["Cards"];

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
      <div className='flex flex-col space-y-3 mb-4' data-export-hide='true'>
        <div className='flex justify-between items-center'>
          <h2 className='text-lg font-semibold text-white'>
            Cards ({totalCards})
          </h2>
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
        <div className='text-center py-8 text-gray-400'>
          <p>This deck is empty.</p>
        </div>
      ) : (
        <div className='space-y-6'>
          {displayedTypes.map((type) => (
            <div key={type} className='space-y-2'>
              <h3 className='text-sm font-medium text-algomancy-gold border-b border-algomancy-gold/30 pb-1'>
                {type} (
                {displayedGroupedCards[type].reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
                )
              </h3>

              {/* List View */}
              {viewMode === "list" && (
                <div className='space-y-1'>
                  {displayedGroupedCards[type]
                    .sort(sortCards)
                    .map(({ card, quantity }) => (
                      <div
                        key={card.id}
                        className='flex items-center justify-between py-1 px-2 hover:bg-algomancy-purple/10 rounded'>
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
                        <span className='text-sm text-white bg-black/60 backdrop-blur-sm border border-white/20 rounded-md px-1.5 py-0.5 min-w-5 text-center'>
                          {quantity}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Compact Grid View */}
              {viewMode === "compact" && (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                  {displayedGroupedCards[type]
                    .sort(sortCards)
                    .map(({ card, quantity }) => (
                      <CardHoverPreview key={card.id} card={card}>
                        <div className='relative group'>
                          <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                            <Image
                              src={card.imageUrl}
                              alt={`${card.name} card`}
                              fill
                              className='object-cover'
                              sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                            />
                          </div>
                          <div className='absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xs font-medium rounded-md px-1.5 py-0.5 flex items-center justify-center'>
                            {quantity}
                          </div>
                        </div>
                      </CardHoverPreview>
                    ))}
                </div>
              )}

              {/* Large Grid View */}
              {viewMode === "large" && (
                <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4'>
                  {displayedGroupedCards[type]
                    .sort(sortCards)
                    .map(({ card, quantity }) => (
                      <div key={card.id} className='relative group'>
                        <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                          <Image
                            src={card.imageUrl}
                            alt={`${card.name} card`}
                            fill
                            className='object-cover'
                            sizes='(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw'
                          />
                        </div>
                        <div className='absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm border border-white/20 text-white text-xs font-medium rounded-md px-1.5 py-0.5 flex items-center justify-center'>
                          {quantity}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
