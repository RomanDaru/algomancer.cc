"use client";

import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import Image from "next/image";
import { PlusIcon, MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CardHoverPreview from "./CardHoverPreview";

interface DeckCardListProps {
  cards: Card[];
  deckCards: DeckCard[];
  onAddCard: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onRemoveAllCopies: (cardId: string) => void;
}

export default function DeckCardList({
  cards,
  deckCards,
  onAddCard,
  onRemoveCard,
  onRemoveAllCopies,
}: DeckCardListProps) {
  // Group cards by type
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};

  // Map deck cards to actual cards
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

  // Sort card types
  const sortedTypes = Object.keys(groupedCards).sort();

  // Calculate total cards
  const totalCards = deckCards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-white'>
          Deck ({totalCards} cards)
        </h3>
      </div>

      {totalCards === 0 ? (
        <div className='text-center py-8 text-gray-400'>
          <p>Your deck is empty.</p>
          <p className='text-sm mt-2'>Add cards from the card browser.</p>
        </div>
      ) : (
        <div className='space-y-4'>
          {sortedTypes.map((type) => (
            <div key={type} className='space-y-2'>
              <h4 className='text-sm font-medium text-algomancy-gold border-b border-algomancy-gold/30 pb-1'>
                {type} (
                {groupedCards[type].reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}
                )
              </h4>
              <div className='space-y-1'>
                {groupedCards[type]
                  .sort((a, b) => a.card.manaCost - b.card.manaCost)
                  .map(({ card, quantity }) => (
                    <div
                      key={card.id}
                      className='flex items-center justify-between py-1 px-2 hover:bg-algomancy-purple/10 rounded'>
                      <div className='flex items-center space-x-2'>
                        <CardHoverPreview card={card}>
                          <div className='w-6 h-6 flex-shrink-0 relative'>
                            <Image
                              src={card.imageUrl}
                              alt={card.name}
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
                          title='Remove one copy'>
                          <MinusIcon className='w-4 h-4' />
                        </button>
                        <span className='text-sm text-white w-5 text-center'>
                          {quantity}
                        </span>
                        <button
                          onClick={() => onAddCard(card.id)}
                          className='p-1 text-gray-400 hover:text-white'
                          title='Add one copy'>
                          <PlusIcon className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => onRemoveAllCopies(card.id)}
                          className='p-1 text-gray-400 hover:text-white ml-1'
                          title='Remove all copies'>
                          <XMarkIcon className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
