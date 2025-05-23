"use client";

import { Card as CardType } from "@/app/lib/types/card";
import Card from "./Card";
import { useState, useRef, useEffect } from "react";
import CardDetails from "./CardDetails";
import CardSearch from "./CardSearch";
import { ViewColumnsIcon, Squares2X2Icon } from "@heroicons/react/24/outline";

interface CardGridProps {
  cards: CardType[];
}

export default function CardGrid({ cards }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [filteredCards, setFilteredCards] = useState<CardType[]>(cards);
  const [viewMode, setViewMode] = useState<"large" | "compact">("large");
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedCard(null);
      }
    }

    if (selectedCard) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedCard]);

  // Handle escape key press
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCard(null);
      }
    }

    if (selectedCard) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [selectedCard]);

  // Update filtered cards when the original cards array changes
  useEffect(() => {
    setFilteredCards(cards);
  }, [cards]);

  return (
    <div className='w-full'>
      {/* Search Component */}
      <CardSearch cards={cards} onSearchResults={setFilteredCards} />

      {/* Results Count and View Toggle */}
      <div className='mb-4 flex justify-between items-center'>
        <div className='text-gray-300'>
          {filteredCards.length === cards.length ? (
            <p>Showing all {cards.length} cards</p>
          ) : (
            <p>Found {filteredCards.length} cards</p>
          )}
        </div>

        {/* View Toggle */}
        <div className='flex space-x-2'>
          <button
            onClick={() => setViewMode("large")}
            className={`p-2 rounded ${
              viewMode === "large"
                ? "bg-algomancy-purple text-white"
                : "bg-algomancy-dark text-gray-400 hover:text-white"
            }`}
            title='Large View'
            aria-label='Large View'
            aria-pressed={viewMode === "large"}>
            <Squares2X2Icon className='w-5 h-5' aria-hidden='true' />
          </button>
          <button
            onClick={() => setViewMode("compact")}
            className={`p-2 rounded ${
              viewMode === "compact"
                ? "bg-algomancy-purple text-white"
                : "bg-algomancy-dark text-gray-400 hover:text-white"
            }`}
            title='Compact View'
            aria-label='Compact View'
            aria-pressed={viewMode === "compact"}>
            <ViewColumnsIcon className='w-5 h-5' aria-hidden='true' />
          </button>
        </div>
      </div>

      {/* Card Grid - Matching the reference image layout */}
      {filteredCards.length > 0 ? (
        <div
          className={`grid gap-4 ${
            viewMode === "large"
              ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              : "grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12"
          }`}>
          {filteredCards.map((card) => (
            <div key={card.id}>
              <Card
                card={card}
                onClick={() => setSelectedCard(card)}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <p className='text-xl text-gray-400'>
            No cards found matching your search criteria.
          </p>
          <p className='text-gray-500 mt-2'>Try adjusting your search terms.</p>
        </div>
      )}

      {/* Card Details Modal */}
      {selectedCard && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div
            ref={modalRef}
            className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 max-w-6xl w-full max-h-[95vh] overflow-y-auto'>
            <CardDetails
              card={selectedCard}
              onClose={() => setSelectedCard(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
