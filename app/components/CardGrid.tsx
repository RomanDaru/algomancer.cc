"use client";

import { Card as CardType } from "@/app/lib/types/card";
import Card from "./Card";
import { useState, useRef, useEffect } from "react";
import CardDetails from "./CardDetails";
import CardSearch from "./CardSearch";

interface CardGridProps {
  cards: CardType[];
}

export default function CardGrid({ cards }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [filteredCards, setFilteredCards] = useState<CardType[]>(cards);
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
    <div className='container mx-auto px-4 py-8'>
      {/* Search Component */}
      <CardSearch cards={cards} onSearchResults={setFilteredCards} />

      {/* Results Count */}
      <div className='mb-4 text-gray-300'>
        {filteredCards.length === cards.length ? (
          <p>Showing all {cards.length} cards</p>
        ) : (
          <p>Found {filteredCards.length} cards</p>
        )}
      </div>

      {/* Card Grid - Matching the reference image layout */}
      {filteredCards.length > 0 ? (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'>
          {filteredCards.map((card) => (
            <div key={card.id}>
              <Card card={card} onClick={() => setSelectedCard(card)} />
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
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div
            ref={modalRef}
            className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
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
