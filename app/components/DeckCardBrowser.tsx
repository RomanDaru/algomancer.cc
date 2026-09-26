"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import { DECK_CONSTRUCTION_RULES } from "@/app/lib/constants";
import CardSearch from "./CardSearch";
import CardHoverPreview from "./CardHoverPreview";
import {
  getCardTotalQuantityAcrossSections,
  getDeckCardQuantity,
} from "@/app/lib/utils/deckSections";

interface DeckCardBrowserProps {
  cards: Card[];
  filteredCards: Card[];
  deckCards: DeckCard[];
  sideboardCards: DeckCard[];
  deckElements: string[];
  onSearchResults: (cards: Card[]) => void;
  onAddToDeck: (cardId: string) => void;
  onAddToSideboard: (cardId: string) => void;
  canAddToDeck: (cardId: string) => boolean;
  canAddToSideboard: (cardId: string) => boolean;
  getAddRestrictionReason?: (
    cardId: string,
    section: "main" | "sideboard"
  ) => string | null;
  mobileFilterSheet?: boolean;
  useHoverPreview?: boolean;
  maxHeightClassName?: string;
  gridClassName?: string;
}

function CardBrowserPreview({
  card,
  useHoverPreview,
  children,
}: {
  card: Card;
  useHoverPreview: boolean;
  children: ReactNode;
}) {
  if (!useHoverPreview) {
    return <>{children}</>;
  }

  return <CardHoverPreview card={card}>{children}</CardHoverPreview>;
}

export default function DeckCardBrowser({
  cards,
  filteredCards,
  deckCards,
  sideboardCards,
  deckElements,
  onSearchResults,
  onAddToDeck,
  onAddToSideboard,
  canAddToDeck,
  canAddToSideboard,
  getAddRestrictionReason,
  mobileFilterSheet = false,
  useHoverPreview = true,
  maxHeightClassName = "max-h-[800px]",
  gridClassName = "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5",
}: DeckCardBrowserProps) {
  return (
    <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4'>
      <h3 className='text-lg font-semibold text-white mb-4'>Card Browser</h3>

      <CardSearch
        cards={cards}
        onSearchResults={onSearchResults}
        deckElements={deckElements}
        mobileFilterSheet={mobileFilterSheet}
      />

      <div className='mt-4'>
        {filteredCards.length > 0 ? (
          <div
            className={`grid ${gridClassName} gap-3 overflow-y-auto custom-scrollbar ${maxHeightClassName}`}>
            {filteredCards.map((card) => {
              const deckQuantity = getDeckCardQuantity(deckCards, card.id);
              const sideboardQuantity = getDeckCardQuantity(
                sideboardCards,
                card.id,
              );
              const totalQuantity = getCardTotalQuantityAcrossSections(
                deckCards,
                sideboardCards,
                card.id,
              );
              const deckRestriction = getAddRestrictionReason?.(card.id, "main");
              const sideboardRestriction = getAddRestrictionReason?.(
                card.id,
                "sideboard"
              );
              const canAddDeck = canAddToDeck(card.id);
              const canAddSideboardCard = canAddToSideboard(card.id);

              return (
                <div
                  key={card.id}
                  className='rounded-lg border border-algomancy-purple/15 bg-black/10 p-2'>
                  <CardBrowserPreview
                    card={card}
                    useHoverPreview={useHoverPreview}>
                    <div className='relative overflow-hidden rounded-md border border-white/10 bg-black/20'>
                      <div className='relative aspect-[3/4] w-full'>
                        <Image
                          src={card.imageUrl}
                          alt={card.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw'
                        />
                      </div>
                    </div>
                  </CardBrowserPreview>

                  <div className='mt-2 space-y-2'>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        type='button'
                        onClick={() => onAddToDeck(card.id)}
                        aria-disabled={!canAddDeck}
                        title={deckRestriction || `Add ${card.name} to Main Deck`}
                        className={`rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-2 py-1.5 text-xs font-medium text-white transition-colors ${
                          canAddDeck
                            ? "hover:border-algomancy-purple hover:bg-algomancy-purple/20"
                            : "cursor-not-allowed opacity-40"
                        }`}>
                        + Deck
                      </button>
                      <button
                        type='button'
                        onClick={() => onAddToSideboard(card.id)}
                        aria-disabled={!canAddSideboardCard}
                        title={sideboardRestriction || `Add ${card.name} to Sideboard`}
                        className={`rounded-md border border-algomancy-gold/30 bg-algomancy-dark px-2 py-1.5 text-xs font-medium text-white transition-colors ${
                          canAddSideboardCard
                            ? "hover:border-algomancy-gold hover:bg-algomancy-gold/15"
                            : "cursor-not-allowed opacity-40"
                        }`}>
                        + SB
                      </button>
                    </div>

                    <div className='flex items-center justify-between text-[11px] text-gray-400'>
                      <span>
                        D {deckQuantity}/
                        {DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone}
                      </span>
                      <span>
                        SB {sideboardQuantity}/
                        {DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone}
                      </span>
                      <span>
                        Total {totalQuantity}/
                        {DECK_CONSTRUCTION_RULES.maxCopiesPerCardTotal}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-12'>
            <p className='text-xl text-gray-400'>
              No cards found matching your search criteria.
            </p>
            <p className='text-gray-500 mt-2'>
              Try adjusting your search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
