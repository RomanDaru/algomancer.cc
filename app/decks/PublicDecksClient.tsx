"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DeckGrid from "@/app/components/DeckGrid";
import ElementFilter from "@/app/components/ElementFilter";
import { ElementType } from "@/app/lib/utils/elements";
import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";

type DeckWithUserInfo = {
  deck: Deck;
  user: { name: string; username: string | null; achievementXp?: number };
  isLikedByCurrentUser: boolean;
  deckElements?: string[];
};

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

interface Props {
  initialDecks: DeckWithUserInfo[];
  filteredCard?: Card | null;
  isAuthenticated: boolean;
}

export default function PublicDecksClient({
  initialDecks,
  filteredCard,
  isAuthenticated,
}: Props) {
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "liked">(
    "newest"
  );
  const [sortTransition, setSortTransition] = useState(false);
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const handleSortChange = (newSortBy: "newest" | "popular" | "liked") => {
    if (newSortBy === sortBy) return;
    setSortTransition(true);
    setSortBy(newSortBy);
    setTimeout(() => setSortTransition(false), 300);
  };

  const decks = useMemo(() => initialDecks, [initialDecks]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [sortBy, selectedElements, filteredCard?.id, initialDecks.length]);

  const filteredAndSorted = useMemo(() => {
    let list = decks;

    if (selectedElements.length > 0) {
      list = list.filter((item) => {
        const elems = (item.deckElements ||
          item.deck.deckElements ||
          []) as ElementType[];
        if (elems.length === 0) return false;
        return selectedElements.every((e) => elems.includes(e));
      });
    }

    const sorted = [...list].sort((a, b) => {
      if (sortBy === "popular") {
        return (b.deck.views || 0) - (a.deck.views || 0);
      } else if (sortBy === "liked") {
        return (b.deck.likes || 0) - (a.deck.likes || 0);
      } else {
        return (
          new Date(b.deck.createdAt).getTime() -
          new Date(a.deck.createdAt).getTime()
        );
      }
    });

    return sorted;
  }, [decks, selectedElements, sortBy]);

  const displayedDecks = filteredAndSorted.slice(0, visibleCount);
  const canLoadMore = filteredAndSorted.length > visibleCount;

  return (
    <div className='mx-auto px-6 py-8 max-w-[95%]'>
      <div className='mb-6'>
        {filteredCard ? (
          <div className='flex items-center'>
            <Link
              href='/decks'
              className='text-algomancy-purple hover:text-algomancy-gold mr-3'>
              ← Back to All Decks
            </Link>
            <h1 className='text-2xl font-bold text-white'>
              Decks with {filteredCard.name}
            </h1>
          </div>
        ) : (
          <>
            <div>
              <h1 className='text-2xl font-bold text-white'>Public Decks</h1>
            </div>
            <div className='mt-4 md:flex md:justify-between md:items-center gap-4 w-full'>
              <ElementFilter onElementsChange={setSelectedElements} />
              <div className='flex items-center space-x-2'>
                <span className='text-gray-400 text-sm'>Sort:</span>
                <button
                  className={`text-sm px-2 py-1 rounded cursor-pointer ${
                    sortBy === "newest"
                      ? "text-algomancy-purple"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => handleSortChange("newest")}>
                  Newest
                </button>
                <button
                  className={`text-sm px-2 py-1 rounded cursor-pointer ${
                    sortBy === "popular"
                      ? "text-algomancy-purple"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => handleSortChange("popular")}>
                  Popular
                </button>
                <button
                  className={`text-sm px-2 py-1 rounded cursor-pointer ${
                    sortBy === "liked"
                      ? "text-algomancy-purple"
                      : "text-gray-400 hover:text-white"
                  }`}
                  onClick={() => handleSortChange("liked")}>
                  Most Liked
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {filteredCard && (
        <div className='bg-algomancy-dark border border-algomancy-purple/30 rounded-lg p-4 mb-6'>
          <div className='flex items-center'>
            <div className='relative w-12 h-16 mr-4 rounded overflow-hidden'>
              <img
                src={filteredCard.imageUrl}
                alt={filteredCard.name}
                className='object-cover w-full h-full'
              />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-algomancy-gold'>
                {filteredCard.name}
              </h2>
              <p className='text-sm text-gray-300'>
                {filteredCard.element.type}{" "}
                {filteredCard.typeAndAttributes.mainType}
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className={`transition-all duration-300 ${
          sortTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"
        }`}>
        <DeckGrid
          decksWithUserInfo={displayedDecks}
          emptyMessage={
            filteredCard
              ? `No decks found containing ${filteredCard.name}`
              : selectedElements.length > 0
              ? `No decks found with ${selectedElements.join(", ")} elements`
              : "No Public Decks Yet"
          }
          emptyAction={
            filteredCard
              ? {
                  text: `Create a deck with ${filteredCard.name}`,
                  link: `/decks/create?card=${filteredCard.id}`,
                }
              : undefined
          }
          createDeckLink='/decks/create'
          createDeckText={
            isAuthenticated ? "Create a Deck" : "Try Deck Builder (Guest Mode)"
          }
          columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
          className='py-4'
        />
      </div>

      {canLoadMore && (
        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={() =>
              setVisibleCount((prev) =>
                Math.min(prev + LOAD_MORE_STEP, filteredAndSorted.length)
              )
            }
            className='inline-flex items-center justify-center px-4 py-2 text-sm rounded-md bg-algomancy-purple/30 hover:bg-algomancy-purple/50 text-white transition-colors'>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
