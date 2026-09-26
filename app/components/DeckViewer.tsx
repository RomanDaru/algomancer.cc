"use client";

import { compareCardValues } from "@/app/lib/utils/cardValues";
import { useMemo, useState } from "react";
import { Card } from "@/app/lib/types/card";
import { DeckCard } from "@/app/lib/types/user";
import Image from "next/image";
import {
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  ViewColumnsIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ArrowsUpDownIcon,
  BoltIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import CardHoverPreview from "./CardHoverPreview";
import { DECK_CONSTRUCTION_RULES } from "@/app/lib/constants";
import {
  canAddCardToSection,
  canMoveCardBetweenSections,
  DeckSection,
  getDeckSectionTotal,
} from "@/app/lib/utils/deckSections";

interface DeckViewerProps {
  cards: Card[];
  deckCards: DeckCard[];
  sideboardCards: DeckCard[];
  onAddCard: (cardId: string, section: DeckSection) => void;
  onRemoveCard: (cardId: string, section: DeckSection) => void;
  onRemoveAllCopies: (cardId: string, section: DeckSection) => void;
  onMoveCard: (cardId: string, from: DeckSection) => void;
}

type ViewMode = "list" | "compact" | "large";
type SortMode = "default" | "mana" | "attack" | "defense";

function sortCards(
  sortMode: SortMode,
  a: { card: Card; quantity: number },
  b: { card: Card; quantity: number }
) {
  switch (sortMode) {
    case "mana":
      return compareCardValues(a.card.manaCost, b.card.manaCost);
    case "attack":
      return compareCardValues(a.card.stats?.power ?? 0, b.card.stats?.power ?? 0);
    case "defense":
      return compareCardValues(a.card.stats?.defense ?? 0, b.card.stats?.defense ?? 0);
    default:
      return compareCardValues(a.card.manaCost, b.card.manaCost);
  }
}

function buildGroupedCards(
  sourceCards: DeckCard[],
  cards: Card[],
  sortMode: SortMode
) {
  const groupedCards: Record<string, { card: Card; quantity: number }[]> = {};

  sourceCards.forEach((deckCard) => {
    const card = cards.find((entry) => entry.id === deckCard.cardId);
    if (!card) {
      return;
    }

    const groupKey =
      sortMode === "default" ? card.typeAndAttributes.mainType : "Cards";

    if (!groupedCards[groupKey]) {
      groupedCards[groupKey] = [];
    }

    groupedCards[groupKey].push({ card, quantity: deckCard.quantity });
  });

  return Object.fromEntries(
    Object.entries(groupedCards).map(([key, value]) => [
      key,
      [...value].sort((a, b) => sortCards(sortMode, a, b)),
    ])
  );
}

export default function DeckViewer({
  cards,
  deckCards,
  sideboardCards,
  onAddCard,
  onRemoveCard,
  onRemoveAllCopies,
  onMoveCard,
}: DeckViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [mobileSection, setMobileSection] = useState<DeckSection>("main");

  const mainDeckGroups = useMemo(
    () => buildGroupedCards(deckCards, cards, sortMode),
    [deckCards, cards, sortMode]
  );
  const sideboardGroups = useMemo(
    () => buildGroupedCards(sideboardCards, cards, sortMode),
    [sideboardCards, cards, sortMode]
  );

  const mainDeckCount = getDeckSectionTotal(deckCards);
  const sideboardCount = getDeckSectionTotal(sideboardCards);

  const sections: Array<{
    key: DeckSection;
    title: string;
    cards: DeckCard[];
    groupedCards: Record<string, { card: Card; quantity: number }[]>;
    countLabel: string;
    emptyTitle: string;
    emptyDescription: string;
  }> = [
    {
      key: "main",
      title: "Main Deck",
      cards: deckCards,
      groupedCards: mainDeckGroups,
      countLabel: `${mainDeckCount} cards`,
      emptyTitle: "Your main deck is empty.",
      emptyDescription: "Add cards from the card browser above.",
    },
    {
      key: "sideboard",
      title: "Sideboard",
      cards: sideboardCards,
      groupedCards: sideboardGroups,
      countLabel: `${sideboardCount}/${DECK_CONSTRUCTION_RULES.maxSideboardCards}`,
      emptyTitle: "No sideboard cards yet.",
      emptyDescription: "Add cards to Sideboard from the browser or move them from the main deck.",
    },
  ];

  const renderCardActions = (
    card: Card,
    quantity: number,
    section: DeckSection
  ) => {
    const canIncrement = canAddCardToSection({
      section,
      cards: deckCards,
      sideboard: sideboardCards,
      cardId: card.id,
      amount: 1,
    });
    const canMove = canMoveCardBetweenSections({
      from: section,
      cards: deckCards,
      sideboard: sideboardCards,
      cardId: card.id,
      amount: 1,
    });
    const moveLabel = section === "main" ? "To SB" : "To Deck";

    return (
      <div className='grid w-full grid-cols-2 gap-1.5'>
        <div className='col-span-2 grid grid-cols-[2rem_minmax(2.5rem,1fr)_2rem] gap-1.5'>
          <button
            type='button'
            onClick={() => onRemoveCard(card.id, section)}
            className='flex h-8 items-center justify-center rounded-md border border-white/10 text-gray-300 transition-colors hover:border-white/20 hover:text-white'
            title='Remove one copy'
            aria-label={`Remove one copy of ${card.name}`}>
            <MinusIcon className='h-4 w-4' aria-hidden='true' />
          </button>
          <span
            className='flex h-8 min-w-0 items-center justify-center rounded-md border border-white/10 bg-black/30 px-1 text-center text-sm text-white'
            aria-label={`${quantity} copies`}>
            {quantity}/{DECK_CONSTRUCTION_RULES.maxCopiesPerCardPerZone}
          </span>
          <button
            type='button'
            onClick={() => onAddCard(card.id, section)}
            disabled={!canIncrement}
            className='flex h-8 items-center justify-center rounded-md border border-white/10 text-gray-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
            title={
              canIncrement
                ? "Add one copy"
                : `Maximum copies reached for ${card.name}`
            }
            aria-label={`Add one copy of ${card.name}`}>
            <PlusIcon className='h-4 w-4' aria-hidden='true' />
          </button>
        </div>
        <button
          type='button'
          onClick={() => onMoveCard(card.id, section)}
          disabled={!canMove}
          title={
            canMove
              ? `Move one copy to ${section === "main" ? "Sideboard" : "Main Deck"}`
              : "Cannot move this card because a copy or sideboard limit was reached"
          }
          className='flex h-8 w-full items-center justify-center rounded-md border border-algomancy-gold/30 px-2 text-center text-xs font-medium leading-none text-white transition-colors hover:border-algomancy-gold hover:bg-algomancy-gold/10 disabled:cursor-not-allowed disabled:opacity-40'>
          {moveLabel}
        </button>
        <button
          type='button'
          onClick={() => onRemoveAllCopies(card.id, section)}
          className='flex h-8 w-full items-center justify-center rounded-md border border-red-500/30 px-2 text-center text-xs font-medium leading-none text-white transition-colors hover:border-red-400 hover:bg-red-500/10'
          title={`Remove all copies of ${card.name}`}
          aria-label={`Remove all copies of ${card.name}`}>
          <TrashIcon className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    );
  };

  const renderSection = (section: (typeof sections)[number]) => {
    const groupedCards = section.groupedCards;
    const displayedTypes = Object.keys(groupedCards).sort();
    const totalCards = getDeckSectionTotal(section.cards);

    return (
      <div
        key={section.key}
        className='rounded-lg border border-algomancy-purple/25 bg-black/10 p-4'>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h4 className='text-lg font-semibold text-white'>{section.title}</h4>
            <p className='text-sm text-gray-400'>{section.countLabel}</p>
          </div>
          {section.key === "sideboard" && (
            <span className='rounded-md border border-algomancy-gold/25 px-2 py-1 text-xs text-gray-300'>
              Optional
            </span>
          )}
        </div>

        {totalCards === 0 ? (
          <div className='rounded-md border border-dashed border-white/10 py-8 text-center text-gray-400'>
            <p>{section.emptyTitle}</p>
            <p className='mt-2 text-sm'>{section.emptyDescription}</p>
          </div>
        ) : (
          <div className='space-y-6'>
            {displayedTypes.map((type) => (
              <div key={`${section.key}-${type}`} className='space-y-2'>
                <h5 className='border-b border-algomancy-gold/30 pb-1 text-sm font-medium text-algomancy-gold'>
                  {type} (
                  {groupedCards[type].reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                  )
                </h5>

                {viewMode === "list" && (
                  <div className='space-y-2'>
                    {groupedCards[type].map(({ card, quantity }) => (
                      <div
                        key={`${section.key}-${card.id}`}
                        className='flex flex-col gap-3 rounded-md border border-white/5 px-2 py-2 md:flex-row md:items-center md:justify-between'>
                        <div className='flex items-center gap-2'>
                          <CardHoverPreview card={card}>
                            <div className='relative h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-white/10'>
                              <Image
                                src={card.imageUrl}
                                alt={`${card.name} card`}
                                fill
                                className='object-cover'
                              />
                            </div>
                          </CardHoverPreview>
                          <span className='truncate text-sm text-white'>
                            {card.name}
                          </span>
                        </div>
                        <div className='w-full md:w-56 md:flex-shrink-0'>
                          {renderCardActions(card, quantity, section.key)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === "compact" && (
                  <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                    {groupedCards[type].map(({ card, quantity }) => (
                      <div
                        key={`${section.key}-${card.id}`}
                        className='overflow-hidden rounded-md border border-white/10 bg-algomancy-dark/70'>
                        <CardHoverPreview card={card}>
                          <div className='relative aspect-[3/4] w-full'>
                            <Image
                              src={card.imageUrl}
                              alt={`${card.name} card`}
                              fill
                              className='object-cover'
                              sizes='(max-width: 767px) 50vw, 25vw'
                            />
                          </div>
                        </CardHoverPreview>
                        <div className='space-y-2 p-2'>
                          <p className='truncate text-sm text-white'>{card.name}</p>
                          <div className='w-full'>
                            {renderCardActions(card, quantity, section.key)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === "large" && (
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {groupedCards[type].map(({ card, quantity }) => (
                      <div
                        key={`${section.key}-${card.id}`}
                        className='overflow-hidden rounded-md border border-white/10 bg-algomancy-dark/70'>
                        <CardHoverPreview card={card}>
                          <div className='relative aspect-[3/4] w-full'>
                            <Image
                              src={card.imageUrl}
                              alt={`${card.name} card`}
                              fill
                              className='object-cover'
                              sizes='(max-width: 767px) 100vw, 50vw'
                            />
                          </div>
                        </CardHoverPreview>
                        <div className='space-y-3 p-3'>
                          <div>
                            <p className='truncate text-base font-medium text-white'>
                              {card.name}
                            </p>
                            <p className='text-xs text-gray-400'>
                              Mana {card.manaCost}
                            </p>
                          </div>
                          <div className='w-full'>
                            {renderCardActions(card, quantity, section.key)}
                          </div>
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
  };

  return (
    <section
      className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4 mt-6'
      aria-labelledby='deck-viewer-heading'>
      <div className='mb-4 flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <h3
            id='deck-viewer-heading'
            className='text-lg font-semibold text-white'>
            Deck Builder
          </h3>
          <div
            className='ml-auto flex gap-1'
            role='toolbar'
            aria-label='View options'>
            <button
              type='button'
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 ${
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
              type='button'
              onClick={() => setViewMode("compact")}
              className={`rounded-md p-2 ${
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
              type='button'
              onClick={() => setViewMode("large")}
              className={`rounded-md p-2 ${
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

        <div className='flex flex-wrap items-center gap-3'>
          <div
            className='inline-flex shrink-0 gap-2 lg:hidden'
            role='group'
            aria-label='Deck section'>
            <button
              type='button'
              onClick={() => setMobileSection("main")}
              aria-pressed={mobileSection === "main"}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                mobileSection === "main"
                  ? "border-algomancy-purple bg-algomancy-purple text-white"
                  : "border-white/10 bg-algomancy-dark text-gray-300 hover:border-white/20 hover:text-white"
              }`}>
              Main Deck ({mainDeckCount})
            </button>
            <button
              type='button'
              onClick={() => setMobileSection("sideboard")}
              aria-pressed={mobileSection === "sideboard"}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                mobileSection === "sideboard"
                  ? "border-algomancy-purple bg-algomancy-purple text-white"
                  : "border-white/10 bg-algomancy-dark text-gray-300 hover:border-white/20 hover:text-white"
              }`}>
              Sideboard ({sideboardCount})
            </button>
          </div>

          <div
            className='ml-auto flex max-w-full flex-wrap justify-end gap-1 rounded-md bg-algomancy-dark p-1'
            role='toolbar'
            aria-label='Sort options'>
            <button
              type='button'
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
              type='button'
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
              type='button'
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
              type='button'
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

      <div className='space-y-4 lg:hidden'>
        {renderSection(
          sections.find((section) => section.key === mobileSection) || sections[0]
        )}
      </div>

      <div className='hidden space-y-4 lg:block'>
        {sections.map(renderSection)}
      </div>
    </section>
  );
}
