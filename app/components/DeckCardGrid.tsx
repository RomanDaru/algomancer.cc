"use client";

import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import Image from "next/image";
import { PlusIcon, MinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CardHoverPreview from "./CardHoverPreview";

interface DeckCardGridProps {
  cards: Card[];
  deckCards: DeckCard[];
  onAddCard: (cardId: string) => void;
  onRemoveCard: (cardId: string) => void;
  onRemoveAllCopies: (cardId: string) => void;
}

export default function DeckCardGrid({
  cards,
  deckCards,
  onAddCard,
  onRemoveCard,
  onRemoveAllCopies,
}: DeckCardGridProps) {
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
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4 mt-6'>
      <h3 className='text-lg font-semibold text-white mb-4'>
        Selected Cards ({totalCards})
      </h3>

      {totalCards === 0 ? (
        <div className='text-center py-8 text-gray-400'>
          <p>Your deck is empty.</p>
          <p className='text-sm mt-2'>Add cards from the card browser above.</p>
        </div>
      ) : (
        <div className='space-y-6'>
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
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                {groupedCards[type]
                  .sort((a, b) => a.card.manaCost - b.card.manaCost)
                  .map(({ card, quantity }) => (
                    <CardHoverPreview
                      key={card.id}
                      card={card}
                      onClick={() => onAddCard(card.id)}>
                      <div className='relative group cursor-pointer'>
                        <div className='relative w-full aspect-[3/4] rounded-md overflow-hidden'>
                          <Image
                            src={card.imageUrl}
                            alt={card.name}
                            fill
                            className='object-cover'
                            sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw'
                            loading='lazy'
                            priority={false}
                          />
                        </div>

                        <div className='absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCard(card.id);
                            }}
                            className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Remove one copy'>
                            <MinusIcon className='w-4 h-4' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddCard(card.id);
                            }}
                            className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Add one copy'>
                            <PlusIcon className='w-4 h-4' />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveAllCopies(card.id);
                            }}
                            className='p-1 bg-black/60 rounded-full text-white hover:bg-black/80'
                            title='Remove all copies'>
                            <XMarkIcon className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    </CardHoverPreview>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
