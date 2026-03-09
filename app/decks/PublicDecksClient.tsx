"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DeckBadge from "@/app/components/DeckBadge";
import DeckGrid from "@/app/components/DeckGrid";
import { DECK_BADGE_VALUES, type DeckBadge as DeckBadgeType } from "@/app/lib/constants";
import ElementIcon from "@/app/components/ElementIcon";
import { ElementType } from "@/app/lib/utils/elements";
import { Card } from "@/app/lib/types/card";
import { Deck } from "@/app/lib/types/user";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type DeckWithUserInfo = {
  deck: Deck;
  user: { name: string; username: string | null; achievementXp?: number };
  isLikedByCurrentUser: boolean;
  deckElements?: string[];
};

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;
const BASIC_ELEMENTS: ElementType[] = [
  "Fire",
  "Water",
  "Earth",
  "Wood",
  "Metal",
  "Dark",
  "Light",
];

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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedDecks, setSearchedDecks] = useState<DeckWithUserInfo[] | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "liked">(
    "newest"
  );
  const [sortTransition, setSortTransition] = useState(false);
  const [selectedElements, setSelectedElements] = useState<ElementType[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<DeckBadgeType[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [openMenu, setOpenMenu] = useState<"elements" | "badges" | null>(null);

  const handleSortChange = (newSortBy: "newest" | "popular" | "liked") => {
    if (newSortBy === sortBy) return;
    setSortTransition(true);
    setSortBy(newSortBy);
    setTimeout(() => setSortTransition(false), 300);
  };

  const decks = useMemo(() => initialDecks, [initialDecks]);
  const activeDecks = useMemo(
    () => (searchQuery.trim() ? searchedDecks ?? decks : decks),
    [decks, searchQuery, searchedDecks]
  );
  const availableBadges = useMemo(() => {
    const usedBadges = new Set<DeckBadgeType>();

    activeDecks.forEach((item) => {
      item.deck.deckBadges?.forEach((badge) => {
        usedBadges.add(badge);
      });
    });

    return DECK_BADGE_VALUES.filter((badge) => usedBadges.has(badge));
  }, [activeDecks]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [
    sortBy,
    selectedBadges,
    selectedElements,
    filteredCard?.id,
    initialDecks.length,
    searchQuery,
    searchedDecks?.length,
  ]);

  useEffect(() => {
    if (filteredCard) return;

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchedDecks(null);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");

        const params = new URLSearchParams({
          q: trimmedQuery,
          sort: sortBy,
          limit: "100",
        });
        const response = await fetch(`/api/decks/public?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to search decks");
        }

        const data = (await response.json()) as DeckWithUserInfo[];
        setSearchedDecks(data);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("Failed to search public decks:", error);
        setSearchError("Search is temporarily unavailable.");
        setSearchedDecks([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [filteredCard, searchQuery, sortBy]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick, true);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick, true);
  }, []);

  const toggleElement = (element: ElementType) => {
    setSelectedElements((prev) =>
      prev.includes(element)
        ? prev.filter((item) => item !== element)
        : [...prev, element]
    );
  };

  const clearAllElements = () => {
    setSelectedElements([]);
  };

  const toggleBadge = (badge: DeckBadgeType) => {
    setSelectedBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((item) => item !== badge)
        : [...prev, badge]
    );
  };

  const clearAllBadges = () => {
    setSelectedBadges([]);
  };

  const elementFilterLabel =
    selectedElements.length === 0
      ? "Elements"
      : selectedElements.length === 1
      ? selectedElements[0]
      : `Elements (${selectedElements.length})`;

  const badgeFilterLabel =
    selectedBadges.length === 0
      ? "Deck Type"
      : selectedBadges.length === 1
      ? selectedBadges[0]
      : `Deck Type (${selectedBadges.length})`;

  const filteredAndSorted = useMemo(() => {
    let list = decks;
    if (searchQuery.trim()) {
      list = searchedDecks ?? decks;
    }

    if (selectedElements.length > 0) {
      list = list.filter((item) => {
        const elems = (item.deckElements ||
          item.deck.deckElements ||
          []) as ElementType[];
        if (elems.length === 0) return false;
        return selectedElements.every((e) => elems.includes(e));
      });
    }

    if (selectedBadges.length > 0) {
      list = list.filter((item) => {
        const deckBadges = item.deck.deckBadges || [];
        return selectedBadges.every((badge) => deckBadges.includes(badge));
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
  }, [decks, searchQuery, searchedDecks, selectedBadges, selectedElements, sortBy]);

  const displayedDecks = filteredAndSorted.slice(0, visibleCount);
  const canLoadMore = filteredAndSorted.length > visibleCount;

  return (
    <div className='mx-auto max-w-[95%] bg-background px-6 py-8'>
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
            <div
              ref={toolbarRef}
              className='mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.8fr)_170px_170px_170px] lg:items-center'>
              <div className='relative w-full min-w-0'>
                <MagnifyingGlassIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                <input
                  type='search'
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder='Search by deck, author, or card'
                  className='w-full rounded-md border border-algomancy-purple/30 bg-algomancy-dark py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500'
                />
              </div>

              <div className='relative w-full'>
                <button
                  type='button'
                  onClick={() =>
                    setOpenMenu((prev) => (prev === "elements" ? null : "elements"))
                  }
                  className='inline-flex w-full items-center justify-between rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                  <span className='truncate'>{elementFilterLabel}</span>
                  <ChevronDownIcon className='ml-3 h-4 w-4 shrink-0 text-gray-400' />
                </button>
                {openMenu === "elements" && (
                  <div className='absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-algomancy-purple/30 bg-algomancy-darker p-3 shadow-xl lg:right-auto lg:w-[220px]'>
                    <div className='space-y-2'>
                      {BASIC_ELEMENTS.map((element) => {
                        const isSelected = selectedElements.includes(element);
                        return (
                          <button
                            key={element}
                            type='button'
                            onClick={() => toggleElement(element)}
                            className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors ${
                              isSelected
                                ? "bg-algomancy-purple/20 text-white"
                                : "text-gray-300 hover:bg-white/5"
                            }`}>
                            <span className='flex items-center gap-2'>
                              <ElementIcon element={element} size={20} showTooltip={false} />
                              {element}
                            </span>
                            {isSelected && <span className='text-xs text-algomancy-gold'>Selected</span>}
                          </button>
                        );
                      })}
                    </div>
                    {selectedElements.length > 0 && (
                      <button
                        type='button'
                        onClick={clearAllElements}
                        className='mt-3 text-xs text-algomancy-purple transition-colors hover:text-algomancy-gold'>
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {availableBadges.length > 0 && (
                <div className='relative w-full'>
                  <button
                    type='button'
                    onClick={() =>
                      setOpenMenu((prev) => (prev === "badges" ? null : "badges"))
                    }
                    className='inline-flex w-full items-center justify-between rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                    <span className='truncate'>{badgeFilterLabel}</span>
                    <ChevronDownIcon className='ml-3 h-4 w-4 shrink-0 text-gray-400' />
                  </button>
                  {openMenu === "badges" && (
                    <div className='absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-algomancy-purple/30 bg-algomancy-darker p-3 shadow-xl lg:right-auto lg:w-[240px]'>
                      <div className='flex flex-wrap gap-2'>
                        {availableBadges.map((badge) => {
                          const isSelected = selectedBadges.includes(badge);
                          return (
                            <button
                              key={badge}
                              type='button'
                              onClick={() => toggleBadge(badge)}
                              className={`rounded-full transition-opacity ${
                                isSelected
                                  ? "opacity-100"
                                  : "opacity-65 hover:opacity-100"
                              }`}
                              aria-pressed={isSelected}>
                              <DeckBadge badge={badge} />
                            </button>
                          );
                        })}
                      </div>
                      {selectedBadges.length > 0 && (
                        <button
                          type='button'
                          onClick={clearAllBadges}
                          className='mt-3 text-xs text-algomancy-purple transition-colors hover:text-algomancy-gold'>
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className='w-full'>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    handleSortChange(
                      event.target.value as "newest" | "popular" | "liked"
                    )
                  }
                  className='w-full rounded-md border border-algomancy-purple/30 bg-algomancy-dark px-3 py-2 text-sm text-white'>
                  <option value='newest'>Sort: Newest</option>
                  <option value='popular'>Sort: Popular</option>
                  <option value='liked'>Sort: Most Liked</option>
                </select>
              </div>
            </div>

            {(isSearching || searchError) && (
              <div className='mt-3 text-sm'>
                {isSearching && (
                  <p className='text-gray-400'>Searching public decks...</p>
                )}
                {!isSearching && searchError && (
                  <p className='text-red-400'>{searchError}</p>
                )}
              </div>
            )}
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
              : searchQuery.trim()
              ? "No public decks matched your search"
              : selectedElements.length > 0 || selectedBadges.length > 0
              ? "No decks match the current filters"
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
